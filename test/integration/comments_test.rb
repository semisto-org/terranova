require 'test_helper'

# Substrat commentaires + @mentions polymorphe (#102, epic #101).
# Couvre : CRUD imbriqué par parent (task/event), extraction serveur des
# mentions, sanitization (script strippé, span mention conservé),
# suppression auteur-ou-admin.
class CommentsTest < ActionDispatch::IntegrationTest
  setup do
    @author = create_member(first_name: 'Ada')
    @other = create_member(first_name: 'Boris')
    @admin = create_member(first_name: 'Root', is_admin: true)
    Thread.current[:test_member] = @author

    project = PoleProject.create!(name: 'Communication', pole: 'academy')
    list = TaskList.create!(name: 'À faire', taskable: project)
    @task = list.tasks.create!(name: 'Préparer la réunion', status: 'pending')

    event_type = EventType.create!(label: "Réunion-#{SecureRandom.hex(3)}")
    @event = Event.create!(
      title: 'Journée collective', event_type: event_type,
      start_date: Date.tomorrow, end_date: Date.tomorrow, projectable: project
    )
  end

  teardown { Thread.current[:test_member] = nil }

  test 'create a comment on a task with a mention persists the structured mention' do
    body = %(<p>On en parle <span data-type="mention" data-id="#{@other.id}" data-label="Boris">@Boris</span> ?</p>)

    assert_difference -> { Comment.count } => 1, -> { Mention.count } => 1 do
      post "/api/v1/tasks/#{@task.id}/comments", params: { body: body }, as: :json
    end
    assert_response :created

    payload = JSON.parse(response.body)['comment']
    assert_equal @author.id.to_s, payload['authorId']
    assert payload['canDelete']
    assert_equal [@other.id.to_s], payload['mentions'].map { |m| m['id'] }

    comment = Comment.last
    assert_equal @task, comment.commentable
    assert_equal [@other.id], comment.mentions.pluck(:member_id)
  end

  test 'create a comment on an event works through the nested route' do
    post "/api/v1/events/#{@event.id}/comments", params: { body: '<p>Présent !</p>' }, as: :json
    assert_response :created
    assert_equal @event, Comment.last.commentable
  end

  test 'index lists comments chronologically with author info' do
    older = @task.comments.create!(author: @other, body: '<p>premier</p>', created_at: 2.hours.ago)
    newer = @task.comments.create!(author: @author, body: '<p>second</p>')

    get "/api/v1/tasks/#{@task.id}/comments", as: :json
    assert_response :success

    comments = JSON.parse(response.body)['comments']
    assert_equal [older.id.to_s, newer.id.to_s], comments.map { |c| c['id'] }
    assert_equal 'Boris H', comments.first['authorName']
    refute comments.first['canDelete'], 'Ada ne peut pas supprimer le commentaire de Boris'
    assert comments.last['canDelete']
  end

  test 'script tags are stripped while mention spans survive sanitization' do
    body = %(<p><script>alert(1)</script><span onclick="x()" data-type="mention" data-id="#{@other.id}">@Boris</span></p>)
    post "/api/v1/tasks/#{@task.id}/comments", params: { body: body }, as: :json
    assert_response :created

    saved = Comment.last.body
    refute_includes saved, '<script'
    refute_includes saved, 'onclick'
    assert_includes saved, 'data-type="mention"'
    assert_includes saved, %(data-id="#{@other.id}")
  end

  test 'mentions of unknown members are ignored' do
    body = '<p><span data-type="mention" data-id="999999">@fantome</span></p>'
    assert_no_difference -> { Mention.count } do
      post "/api/v1/tasks/#{@task.id}/comments", params: { body: body }, as: :json
    end
    assert_response :created
  end

  test 'empty body is rejected' do
    post "/api/v1/tasks/#{@task.id}/comments", params: { body: '' }, as: :json
    assert_response :unprocessable_entity
  end

  test 'author can delete their own comment' do
    comment = @task.comments.create!(author: @author, body: '<p>à effacer</p>')
    assert_difference -> { Comment.count } => -1 do
      delete "/api/v1/tasks/#{@task.id}/comments/#{comment.id}", as: :json
    end
    assert_response :no_content
  end

  test 'a non-author non-admin member cannot delete the comment' do
    comment = @task.comments.create!(author: @author, body: '<p>protégé</p>')
    Thread.current[:test_member] = @other

    assert_no_difference -> { Comment.count } do
      delete "/api/v1/tasks/#{@task.id}/comments/#{comment.id}", as: :json
    end
    assert_response :forbidden
  end

  test 'an admin can delete any comment' do
    comment = @task.comments.create!(author: @author, body: '<p>modérable</p>')
    Thread.current[:test_member] = @admin

    assert_difference -> { Comment.count } => -1 do
      delete "/api/v1/tasks/#{@task.id}/comments/#{comment.id}", as: :json
    end
    assert_response :no_content
  end

  test 'deleting a comment cascades its mentions' do
    body = %(<p><span data-type="mention" data-id="#{@other.id}">@Boris</span></p>)
    post "/api/v1/tasks/#{@task.id}/comments", params: { body: body }, as: :json
    comment_id = JSON.parse(response.body)['comment']['id']

    assert_difference -> { Mention.count } => -1 do
      delete "/api/v1/tasks/#{@task.id}/comments/#{comment_id}", as: :json
    end
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
