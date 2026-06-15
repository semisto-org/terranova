require 'test_helper'

# Notifications + activity_events (#104, epic #101, amendement 11/06).
# Couvre : séquence événement-puis-fan-out, les 5 déclencheurs (assignation,
# ping, commentaire, mention, échéance J-1), jamais-l'acteur, respect des
# abonnements/mute de #103, idempotence (rejeu sans doublon), conception
# ouverte (nouveau type d'événement sans refonte).
#
# Pas d'endpoint dans cette issue (pure persistance interne) : le seul appel
# HTTP réutilise l'endpoint commentaires de #102, sans impact OpenAPI.
class NotificationsTest < ActionDispatch::IntegrationTest
  setup do
    @actor = create_member(first_name: 'Ada')
    @assignee = create_member(first_name: 'Boris')
    @watcher = create_member(first_name: 'Carl')
    Thread.current[:test_member] = @actor

    @project = PoleProject.create!(name: 'Communication', pole: 'academy')
    [@actor, @assignee, @watcher].each do |m|
      ProjectMembership.create!(projectable: @project, member: m, role: 'member')
    end
    @list = TaskList.create!(name: 'À faire', taskable: @project)
    @task = @list.tasks.create!(name: 'Préparer la réunion', status: 'pending')
  end

  teardown { Thread.current[:test_member] = nil }

  # ── Déclencheur : assignation ────────────────────────────────────────────

  test 'assignment writes the event first then notifies the assignee, never the actor' do
    assert_difference -> { ActivityEvent.count } => 1 do
      @task.update!(assignee: @assignee, assigned_by: @actor)
    end

    event = ActivityEvent.last
    assert_equal 'task_assigned', event.action
    assert_equal @task, event.subject
    assert_equal @project, event.projectable
    assert_equal @actor, event.actor

    notifications = event.notifications
    assert_equal [@assignee.id], notifications.map(&:recipient_id)
    assert_equal 'assignment', notifications.first.kind
    assert_equal @task, notifications.first.notifiable
  end

  test 'self-assignment writes the event but notifies nobody' do
    assert_difference -> { ActivityEvent.count } => 1, -> { Notification.count } => 0 do
      @task.update!(assignee: @actor, assigned_by: @actor)
    end
  end

  # ── Déclencheur : ping (coucou) ──────────────────────────────────────────

  test 'pinging a task notifies its subscribers with kind ping' do
    @task.update!(assignee: @assignee, assigned_by: @actor)

    assert_difference -> { Notification.where(kind: 'ping').count } => 1 do
      @task.update!(pinged_at: Time.current, pinged_by: @actor)
    end
    assert_equal @assignee.id, Notification.where(kind: 'ping').last.recipient_id
  end

  test 'removing a ping does not notify' do
    @task.update!(assignee: @assignee, assigned_by: @actor, pinged_at: Time.current, pinged_by: @actor)

    assert_no_difference -> { ActivityEvent.where(action: 'task_pinged').count } do
      @task.update!(pinged_at: nil, pinged_by: nil)
    end
  end

  # ── Déclencheurs : commentaire + mention (via l'endpoint HTTP de #102) ──

  test 'a comment notifies subscribers (kind comment) and mentioned members (kind mention), never the author' do
    @task.auto_subscribe!(@watcher)
    body = %(<p>On avance <span data-type="mention" data-id="#{@assignee.id}">@Boris</span> ?</p>)

    assert_difference -> { ActivityEvent.where(action: 'comment_created').count } => 1 do
      post "/api/v1/tasks/#{@task.id}/comments", params: { body: body }, as: :json
    end
    assert_response :created

    event = ActivityEvent.where(action: 'comment_created').last
    kinds = event.notifications.group_by(&:kind).transform_values { |n| n.map(&:recipient_id) }
    assert_equal [@assignee.id], kinds['mention'], 'le mentionné reçoit une notification mention'
    assert_equal [@watcher.id], kinds['comment'], "l'abonné reçoit une notification comment"
    refute_includes event.notifications.map(&:recipient_id), @actor.id, "l'auteur n'est jamais notifié"
  end

  test 'a mentioned member gets exactly one notification, not mention plus comment' do
    body = %(<p><span data-type="mention" data-id="#{@assignee.id}">@Boris</span></p>)
    @task.comments.create!(author: @actor, body: body)

    assert_equal 1, Notification.where(recipient_id: @assignee.id).count
    assert_equal 'mention', Notification.where(recipient_id: @assignee.id).first.kind
  end

  # ── Respect des abonnements / mute (#103) ────────────────────────────────

  test 'project mute silences auto subscribers but explicit follow passes through' do
    @task.auto_subscribe!(@assignee)
    @task.subscribe!(@watcher)
    @project.mute!(@assignee)
    @project.mute!(@watcher)

    @task.comments.create!(author: @actor, body: '<p>silence ?</p>')

    recipient_ids = ActivityEvent.where(action: 'comment_created').last.notifications.map(&:recipient_id)
    refute_includes recipient_ids, @assignee.id, 'abonné auto muté = silencé'
    assert_includes recipient_ids, @watcher.id, 'suivi explicite traverse le mute'
  end

  test 'an unsubscribed member is never notified' do
    @task.auto_subscribe!(@watcher)
    @task.unsubscribe!(@watcher)

    @task.comments.create!(author: @actor, body: '<p>rien pour Carl</p>')

    refute_includes Notification.all.map(&:recipient_id), @watcher.id
  end

  # ── Déclencheur : échéance proche (J-1, job recurring) ──────────────────

  test 'due-soon job notifies subscribers of tasks due tomorrow with an assignee' do
    due = @list.tasks.create!(name: 'Pour demain', status: 'pending', due_date: Date.tomorrow)
    due.update!(assignee: @assignee, assigned_by: @actor)
    @list.tasks.create!(name: 'Sans assigné', status: 'pending', due_date: Date.tomorrow)
    @list.tasks.create!(name: 'Pas demain', status: 'pending', due_date: 3.days.from_now.to_date, assignee_id: nil)
    done = @list.tasks.create!(name: 'Finie', status: 'pending', due_date: Date.tomorrow)
    done.update!(assignee: @assignee, assigned_by: @actor)
    done.update!(status: 'completed')

    assert_difference -> { ActivityEvent.where(action: 'task_due_soon').count } => 1 do
      TaskDueSoonNotificationJob.perform_now
    end

    event = ActivityEvent.where(action: 'task_due_soon').last
    assert_equal due, event.subject
    assert_nil event.actor
    assert_equal 'due_soon', event.notifications.first.kind
    assert_equal [@assignee.id], event.notifications.map(&:recipient_id)
  end

  test 'replaying the due-soon job the same day creates no duplicates' do
    due = @list.tasks.create!(name: 'Pour demain', status: 'pending', due_date: Date.tomorrow)
    due.update!(assignee: @assignee, assigned_by: @actor)

    TaskDueSoonNotificationJob.perform_now
    assert_no_difference [-> { ActivityEvent.count }, -> { Notification.count }] do
      TaskDueSoonNotificationJob.perform_now
    end
  end

  # ── Idempotence du fan-out ───────────────────────────────────────────────

  test 'fanning out twice for the same event never duplicates a notification' do
    @task.auto_subscribe!(@watcher)
    event = NotificationService.record!(action: 'task_assigned', subject: @task, actor: @actor)

    assert_no_difference -> { Notification.count } do
      Notification.create_or_find_by!(recipient_id: @watcher.id, activity_event_id: event.id) do |n|
        n.notifiable = @task
        n.kind = 'assignment'
      end
    end
  end

  # ── Conçu ouvert : nouveau notifiable_type sans refonte ─────────────────

  test 'recording an arbitrary new event type works without any plumbing change' do
    deliberation = Strategy::Deliberation.create!(title: 'Statuts', status: 'open', created_by_id: @watcher.id)
    deliberation.subscribe!(@assignee)

    event = NotificationService.record!(
      action: 'checkin_answered', subject: deliberation, actor: @watcher,
      kind_for: ->(_) { 'checkin' }
    )

    assert_equal 'checkin_answered', event.action
    recipient_ids = event.notifications.map(&:recipient_id)
    assert_includes recipient_ids, @assignee.id
    refute_includes recipient_ids, @watcher.id, "l'acteur (pourtant abonné auto) n'est pas notifié"
    assert_equal 'checkin', event.notifications.first.kind
  end

  # ── Nettoyage en cascade ─────────────────────────────────────────────────

  test 'destroying a commented object cascades its events and notifications' do
    @task.auto_subscribe!(@watcher)
    @task.comments.create!(author: @actor, body: '<p>bientôt supprimé</p>')

    assert_difference -> { ActivityEvent.count } => -1, -> { Notification.count } => -1 do
      @task.comments.last.destroy!
    end
  end

  private

  def create_member(first_name:)
    Member.create!(
      first_name: first_name, last_name: 'H',
      email: "#{first_name.downcase}-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human',
      membership_type: 'effective'
    )
  end
end
