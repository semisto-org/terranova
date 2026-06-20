require 'test_helper'

# Substrat réactions polymorphes (#111, epic #101). Couvre : add/remove
# idempotent (comptage + auteurs), liste fermée de contenus, polymorphisme,
# allowlist des types, AUCUNE notification, et pont lecture depuis l'ancien
# strategy_comment_reactions. La couche UI est différée (#111b).
class ReactionsTest < ActionDispatch::IntegrationTest
  setup do
    @member = create_member(first_name: 'Ada')
    @other  = create_member(first_name: 'Boris')
    Thread.current[:test_member] = @member
    @deliberation = Strategy::Deliberation.create!(title: 'Sujet', status: 'draft')
  end

  teardown { Thread.current[:test_member] = nil }

  def react(content, type: 'Strategy::Deliberation', id: nil)
    post '/api/v1/reactions',
         params: { reactable_type: type, reactable_id: id || @deliberation.id, content: content }, as: :json
  end

  test 'add a reaction returns the grouped count and the authors' do
    assert_difference -> { Reaction.count }, 1 do
      react('thumbs_up')
    end
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal({ 'thumbs_up' => 1 }, body['counts'])
    assert_equal [@member.id], body['authors']['thumbs_up'].map { |a| a['id'] }
  end

  test 'adding the same reaction twice is idempotent (still 1)' do
    react('thumbs_up')
    assert_no_difference -> { Reaction.count } do
      react('thumbs_up')
    end
    assert_response :created
    assert_equal({ 'thumbs_up' => 1 }, JSON.parse(response.body)['counts'])
  end

  test 'a content outside the closed emoji list is rejected' do
    assert_no_difference -> { Reaction.count } do
      react('rocket')
    end
    assert_response :unprocessable_entity
  end

  test 'removing a reaction drops the count to zero' do
    react('thumbs_up')
    delete '/api/v1/reactions',
           params: { reactable_type: 'Strategy::Deliberation', reactable_id: @deliberation.id, content: 'thumbs_up' },
           as: :json
    assert_response :success
    assert_equal({}, JSON.parse(response.body)['counts'])
    assert_equal 0, Reaction.count
  end

  test 'a reaction creates no notification (calm doctrine)' do
    assert_no_difference -> { Notification.count } do
      react('heart')
    end
    assert_response :created
  end

  test 'reactions are polymorphic — they work on a Task too' do
    project = PoleProject.create!(name: 'Comm', pole: 'academy')
    task = TaskList.create!(name: 'À faire', taskable: project).tasks.create!(name: 'X', status: 'pending')
    react('bulb', type: 'Task', id: task.id)
    assert_response :created
    assert_equal({ 'bulb' => 1 }, JSON.parse(response.body)['counts'])
  end

  test 'an unknown reactable type is refused' do
    react('thumbs_up', type: 'Member')
    assert_response :unprocessable_entity
  end

  test 'legacy strategy_comment_reactions stay readable through the bridge' do
    comment = @deliberation.comments.create!(author: @member, content: '<p>hi</p>')
    Strategy::CommentReaction.create!(comment: comment, member: @member, emoji: 'thumbs_up')

    reader = Reactions::LegacyReader.new(comment.id)
    assert_equal({ 'thumbs_up' => 1 }, reader.counts)
    assert_equal [@member.id], reader.authors['thumbs_up'].map { |a| a[:id] }
  end

  private

  def create_member(first_name:, is_admin: false)
    Member.create!(
      first_name: first_name, last_name: 'H',
      email: "#{first_name.downcase}-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human',
      membership_type: 'effective', is_admin: is_admin
    )
  end
end
