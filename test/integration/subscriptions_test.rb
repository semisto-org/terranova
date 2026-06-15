require 'test_helper'

# Abonnements polymorphes (#103, epic #101).
# Couvre : hooks d'abonnement auto (assignation, commentaire, mention,
# auteur de délibération), suivre/ne-plus-suivre explicite, primauté du
# désabonnement explicite sur l'auto, mute projet et primauté du suivi
# explicite sur le mute, résolution notifiable_member_ids (contrat #104).
class SubscriptionsTest < ActionDispatch::IntegrationTest
  setup do
    @member = create_member(first_name: 'Ada')
    @other = create_member(first_name: 'Boris')
    Thread.current[:test_member] = @member

    @project = PoleProject.create!(name: 'Communication', pole: 'academy')
    # L'assignation exige l'appartenance à l'équipe projet (validation Task).
    ProjectMembership.create!(projectable: @project, member: @member, role: 'member')
    ProjectMembership.create!(projectable: @project, member: @other, role: 'member')
    @list = TaskList.create!(name: 'À faire', taskable: @project)
    @task = @list.tasks.create!(name: 'Préparer la réunion', status: 'pending')
  end

  teardown { Thread.current[:test_member] = nil }

  # ── Hooks d'abonnement auto ──────────────────────────────────────────────

  test 'assigning a task auto-subscribes the assignee' do
    @task.update!(assignee: @other)

    sub = @task.subscription_for(@other)
    assert_equal 'auto', sub.state
  end

  test 'commenting auto-subscribes the comment author' do
    @task.comments.create!(author: @other, body: '<p>présent</p>')

    assert_equal 'auto', @task.subscription_for(@other)&.state
  end

  test 'being mentioned auto-subscribes the mentioned member' do
    body = %(<p><span data-type="mention" data-id="#{@other.id}">@Boris</span></p>)
    @task.comments.create!(author: @member, body: body)

    assert_equal 'auto', @task.subscription_for(@other)&.state
  end

  test 'creating a deliberation auto-subscribes its creator' do
    deliberation = Strategy::Deliberation.create!(title: 'Choix du lieu', status: 'draft', created_by_id: @member.id)

    assert_equal 'auto', deliberation.subscription_for(@member)&.state
  end

  test 'auto-subscription never overwrites an explicit unsubscribe' do
    @task.unsubscribe!(@other)
    @task.update!(assignee: @other)

    assert_equal 'unsubscribed', @task.subscription_for(@other).state
  end

  test 'auto-subscription never downgrades an explicit follow' do
    @task.subscribe!(@other)
    @task.update!(assignee: @other)

    assert_equal 'explicit', @task.subscription_for(@other).state
  end

  # ── Endpoints suivre / ne plus suivre ────────────────────────────────────
  # NB rspec-openapi (Minitest) n'enregistre que la DERNIÈRE requête de chaque
  # test : chaque (chemin, verbe) à documenter termine donc son propre test.

  test 'follow a task through the API' do
    post "/api/v1/tasks/#{@task.id}/subscription", as: :json
    assert_response :created
    assert JSON.parse(response.body)['subscribed']
    assert_equal 'explicit', @task.subscription_for(@member).state
  end

  test 'unfollow a task through the API' do
    @task.subscribe!(@member)

    delete "/api/v1/tasks/#{@task.id}/subscription", as: :json
    assert_response :success
    refute JSON.parse(response.body)['subscribed']
    assert_equal 'unsubscribed', @task.subscription_for(@member).state
  end

  test 'subscription state endpoint reflects auto subscriptions' do
    @task.update!(assignee: @member)

    get "/api/v1/tasks/#{@task.id}/subscription", as: :json
    assert_response :success
    payload = JSON.parse(response.body)
    assert payload['subscribed']
    assert_equal 'auto', payload['state']
  end

  test 'follow an event through its nested route' do
    post "/api/v1/events/#{create_event.id}/subscription", as: :json
    assert_response :created
  end

  test 'unfollow an event through its nested route' do
    event = create_event
    event.subscribe!(@member)

    delete "/api/v1/events/#{event.id}/subscription", as: :json
    assert_response :success
    assert_equal 'unsubscribed', event.subscription_for(@member).state
  end

  test 'subscription state of an event' do
    get "/api/v1/events/#{create_event.id}/subscription", as: :json
    assert_response :success
    refute JSON.parse(response.body)['subscribed']
  end

  test 'follow a deliberation through its nested route' do
    deliberation = create_deliberation

    post "/api/v1/strategy/deliberations/#{deliberation.id}/subscription", as: :json
    assert_response :created
    assert_equal 'explicit', deliberation.subscription_for(@member).state
  end

  test 'unfollow a deliberation through its nested route' do
    deliberation = create_deliberation
    deliberation.subscribe!(@member)

    delete "/api/v1/strategy/deliberations/#{deliberation.id}/subscription", as: :json
    assert_response :success
    assert_equal 'unsubscribed', deliberation.subscription_for(@member).state
  end

  test 'subscription state of a deliberation' do
    get "/api/v1/strategy/deliberations/#{create_deliberation.id}/subscription", as: :json
    assert_response :success
  end

  # ── Mute projet ──────────────────────────────────────────────────────────

  test 'mute a project through the API' do
    post "/api/v1/projects/lab-project/#{@project.id}/mute", as: :json
    assert_response :created
    assert JSON.parse(response.body)['muted']
    assert @project.muted_by?(@member)
  end

  test 'unmute a project through the API' do
    @project.mute!(@member)

    delete "/api/v1/projects/lab-project/#{@project.id}/mute", as: :json
    assert_response :success
    refute JSON.parse(response.body)['muted']
    refute @project.reload.muted_by?(@member)
  end

  test 'mute state of a project' do
    get "/api/v1/projects/lab-project/#{@project.id}/mute", as: :json
    assert_response :success
    refute JSON.parse(response.body)['muted']
  end

  test 'unknown project type returns bad request' do
    post "/api/v1/projects/inconnu/1/mute", as: :json
    assert_response :bad_request
  end

  # ── Résolution des destinataires (contrat consommé par #104) ────────────

  test 'project mute silences auto subscriptions but explicit follow wins' do
    auto_member = create_member(first_name: 'Carl')
    explicit_member = create_member(first_name: 'Dora')

    @task.auto_subscribe!(auto_member)
    @task.auto_subscribe!(explicit_member)
    @task.subscribe!(explicit_member)
    @project.mute!(auto_member)
    @project.mute!(explicit_member)

    ids = @task.notifiable_member_ids
    refute_includes ids, auto_member.id, 'un abonnement auto est silencé par le mute projet'
    assert_includes ids, explicit_member.id, 'le suivi explicite prime sur le mute projet'
  end

  test 'unsubscribed members are never notifiable' do
    @task.auto_subscribe!(@other)
    @task.unsubscribe!(@other)

    refute_includes @task.notifiable_member_ids, @other.id
  end

  test 'deliberations without project resolve subscribers directly' do
    deliberation = Strategy::Deliberation.create!(title: 'Statuts', status: 'open', created_by_id: @member.id)

    assert_includes deliberation.notifiable_member_ids, @member.id
  end

  private

  def create_event
    event_type = EventType.create!(label: "Réunion-#{SecureRandom.hex(3)}")
    Event.create!(title: 'Journée', event_type: event_type,
                  start_date: Date.tomorrow, end_date: Date.tomorrow, projectable: @project)
  end

  def create_deliberation
    Strategy::Deliberation.create!(title: "Budget-#{SecureRandom.hex(2)}", status: 'open', created_by_id: @other.id)
  end

  def create_member(first_name:)
    Member.create!(
      first_name: first_name, last_name: 'H',
      email: "#{first_name.downcase}-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human',
      membership_type: 'effective'
    )
  end
end
