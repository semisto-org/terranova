require 'test_helper'

# Campfire (#145, tranche 119a) — socle backend du chat léger par projet.
# Couvre : modèle polymorphe `projectable`, historique REST paginé &
# chronologique, validation du body, et la règle de doctrine calme
# @mention -> Notification (les deux cas : avec mention = 1 notif, sans = 0).
# PAS de temps réel (119b) — uniquement la couche REST.
class ChatMessagesTest < ActionDispatch::IntegrationTest
  setup do
    @author = create_member(first_name: 'Ada')
    @mentioned = create_member(first_name: 'Boris')
    Thread.current[:test_member] = @author

    @project = PoleProject.create!(name: 'Communication', pole: 'academy')
    # Un second projet (type différent) pour vérifier l'adressage polymorphe.
training_type = Academy::TrainingType.create!(name: "Greffe-#{SecureRandom.hex(3)}")
    @training = Academy::Training.create!(
      title: 'Greffe', status: 'idea', training_type: training_type
    )
  end

  teardown { Thread.current[:test_member] = nil }

  # ── Création + polymorphisme ───────────────────────────────────────────────

  test 'create a chat message on a lab project persists it polymorphically' do
    assert_difference -> { ChatMessage.count } => 1 do
      post "/api/v1/projects/lab-project/#{@project.id}/chat-messages",
        params: { body: '<p>Salut tout le monde !</p>' }, as: :json
    end
    assert_response :created

    payload = JSON.parse(response.body)['message']
    assert_equal @author.id.to_s, payload['authorId']
    assert_equal 'Ada H', payload['authorName']

    message = ChatMessage.last
    assert_equal @project, message.projectable
    assert_equal @author, message.author
  end

  test 'create a chat message on a training works through the same projectable route' do
    post "/api/v1/projects/training/#{@training.id}/chat-messages",
      params: { body: '<p>Présent !</p>' }, as: :json
    assert_response :created
    assert_equal @training, ChatMessage.last.projectable
  end

  test 'unknown project type is rejected' do
    post "/api/v1/projects/wat/#{@project.id}/chat-messages",
      params: { body: '<p>hi</p>' }, as: :json
    assert_response :bad_request
  end

  # ── Validation ─────────────────────────────────────────────────────────────

  test 'empty body is rejected' do
    assert_no_difference -> { ChatMessage.count } do
      post "/api/v1/projects/lab-project/#{@project.id}/chat-messages",
        params: { body: '' }, as: :json
    end
    assert_response :unprocessable_entity
  end

  test 'blank (whitespace-only) body is rejected' do
    assert_no_difference -> { ChatMessage.count } do
      post "/api/v1/projects/lab-project/#{@project.id}/chat-messages",
        params: { body: '   ' }, as: :json
    end
    assert_response :unprocessable_entity
  end

  # ── Historique paginé & chronologique ──────────────────────────────────────

  test 'index lists messages chronologically with author info' do
    older = @project.chat_messages.create!(author: @mentioned, body: '<p>premier</p>', created_at: 2.hours.ago)
    newer = @project.chat_messages.create!(author: @author, body: '<p>second</p>')

    get "/api/v1/projects/lab-project/#{@project.id}/chat-messages", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal [older.id.to_s, newer.id.to_s], body['messages'].map { |m| m['id'] }
    assert_equal 'Boris H', body['messages'].first['authorName']
    assert_equal 2, body['total']
  end

  test 'history is paginated via limit and offset, preserving chronological order' do
    created = 5.times.map do |i|
      @project.chat_messages.create!(author: @author, body: "<p>msg #{i}</p>", created_at: (10 - i).minutes.ago)
    end
    ordered_ids = created.sort_by(&:created_at).map { |m| m.id.to_s }

    # Première page
    get "/api/v1/projects/lab-project/#{@project.id}/chat-messages",
      params: { limit: 2, offset: 0 }, as: :json
    assert_response :success
    page1 = JSON.parse(response.body)
    assert_equal 5, page1['total']
    assert_equal 2, page1['limit']
    assert_equal 0, page1['offset']
    assert_equal ordered_ids[0, 2], page1['messages'].map { |m| m['id'] }

    # Deuxième page — continuité chronologique
    get "/api/v1/projects/lab-project/#{@project.id}/chat-messages",
      params: { limit: 2, offset: 2 }, as: :json
    page2 = JSON.parse(response.body)
    assert_equal ordered_ids[2, 2], page2['messages'].map { |m| m['id'] }

    # Dernière page partielle
    get "/api/v1/projects/lab-project/#{@project.id}/chat-messages",
      params: { limit: 2, offset: 4 }, as: :json
    page3 = JSON.parse(response.body)
    assert_equal ordered_ids[4, 1], page3['messages'].map { |m| m['id'] }
  end

  test 'history is scoped to the project (no cross-project leakage)' do
    @project.chat_messages.create!(author: @author, body: '<p>ici</p>')
    @training.chat_messages.create!(author: @author, body: '<p>ailleurs</p>')

    get "/api/v1/projects/lab-project/#{@project.id}/chat-messages", as: :json
    body = JSON.parse(response.body)
    assert_equal 1, body['total']
    assert_equal '<p>ici</p>', body['messages'].first['body']
  end

  # ── Doctrine calme : @mention -> Notification, sinon rien ───────────────────

  test 'a message with an @mention creates exactly one notification for the mentioned member' do
    mention = %(<span data-type="mention" data-id="#{@mentioned.id}" data-label="Boris">@Boris</span>)
    body = "<p>Hello #{mention} tu peux relire ?</p>"

    assert_difference -> { Notification.count } => 1 do
      post "/api/v1/projects/lab-project/#{@project.id}/chat-messages",
        params: { body: body }, as: :json
    end
    assert_response :created

    notif = Notification.last
    assert_equal @mentioned.id, notif.recipient_id
    assert_equal 'mention', notif.kind
    assert_equal @author.id, notif.actor_id
    assert_equal ChatMessage.last, notif.notifiable
  end

  test 'a message WITHOUT any @mention creates zero notification' do
    assert_no_difference -> { Notification.count } do
      post "/api/v1/projects/lab-project/#{@project.id}/chat-messages",
        params: { body: '<p>Juste un message tranquille, personne mentionné.</p>' }, as: :json
    end
    assert_response :created
  end

  test 'mentioning the author themselves does not notify the actor' do
    mention = %(<span data-type="mention" data-id="#{@author.id}">@Ada</span>)
    assert_no_difference -> { Notification.count } do
      post "/api/v1/projects/lab-project/#{@project.id}/chat-messages",
        params: { body: "<p>note pour moi #{mention}</p>" }, as: :json
    end
    assert_response :created
  end

  test 'a mention of an unknown member id creates no notification' do
    mention = %(<span data-type="mention" data-id="999999">@fantome</span>)
    assert_no_difference -> { Notification.count } do
      post "/api/v1/projects/lab-project/#{@project.id}/chat-messages",
        params: { body: "<p>coucou #{mention}</p>" }, as: :json
    end
    assert_response :created
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
