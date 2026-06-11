# frozen_string_literal: true

require 'test_helper'

class ActivityTest < ActionDispatch::IntegrationTest
  setup do
    @member = create_member(first_name: 'Ada')
    @other = create_member(first_name: 'Boris')
    Thread.current[:test_member] = @member

    @project = PoleProject.create!(name: 'Communication', pole: 'academy')
    @other_project = PoleProject.create!(name: 'Projet secret', pole: 'academy')
    ProjectMembership.create!(projectable: @project, member: @member, role: 'member')
    ProjectMembership.create!(projectable: @other_project, member: @other, role: 'member')

    @list = TaskList.create!(name: 'À faire', taskable: @project)
    @task = @list.tasks.create!(name: 'Préparer la réunion', status: 'pending')
    @other_list = TaskList.create!(name: 'À faire', taskable: @other_project)
    @other_task = @other_list.tasks.create!(name: 'Plan confidentiel', status: 'pending')
    @event_type = EventType.create!(label: "Réunion-#{SecureRandom.hex(3)}")
  end

  teardown { Thread.current[:test_member] = nil }

  test 'feed lists my project events and no-project events, not other project events' do
    mine = create_activity(action: 'task_assigned', subject: @task, actor: @member, projectable: @project)
    global = create_activity(action: 'deliberation_opened', subject: create_deliberation('Statuts'), actor: @other, projectable: nil)
    foreign = create_activity(action: 'task_assigned', subject: @other_task, actor: @other, projectable: @other_project)

    get "/api/v1/activity", as: :json
    assert_response :success

    ids = payload_events.map { |event| event['id'] }
    assert_includes ids, mine.id
    assert_includes ids, global.id
    refute_includes ids, foreign.id
  end

  test 'project filter limits the feed to one project and unknown project types stay empty' do
    project_event = create_activity(action: 'task_assigned', subject: @task, actor: @member, projectable: @project)
    create_activity(action: 'deliberation_opened', subject: create_deliberation('Raison d’être'), actor: @member, projectable: nil)

    get "/api/v1/activity?project=unknown:#{@project.id}", as: :json
    assert_response :success
    assert_empty payload_events

    get "/api/v1/activity?project=lab-project:#{@project.id}", as: :json
    assert_response :success
    assert_equal [project_event.id], payload_events.map { |event| event['id'] }
  end

  test 'subject type filter composes with the visible feed' do
    event = Event.create!(
      title: 'Journée',
      event_type: @event_type,
      start_date: Date.tomorrow,
      end_date: Date.tomorrow,
      projectable: @project
    )
    task_event = create_activity(action: 'task_assigned', subject: @task, actor: @member, projectable: @project)
    calendar_event = create_activity(action: 'event_created', subject: event, actor: @member, projectable: @project)

    get "/api/v1/activity?subject_type=Event", as: :json
    assert_response :success

    ids = payload_events.map { |item| item['id'] }
    assert_equal [calendar_event.id], ids
    refute_includes ids, task_event.id
  end

  test 'scope mine shows only events acted by the current member' do
    mine = create_activity(action: 'task_assigned', subject: @task, actor: @member, projectable: @project)
    create_activity(action: 'comment_created', subject: @task, actor: @other, projectable: @project)
    create_activity(action: 'task_due_soon', subject: @task, actor: nil, projectable: @project)

    get "/api/v1/activity?scope=mine", as: :json
    assert_response :success
    assert_equal [mine.id], payload_events.map { |event| event['id'] }
  end

  test 'before and limit paginate with stable id tie break' do
    timestamp = Time.current
    oldest = create_activity(action: 'task_assigned', subject: @task, actor: @member, projectable: @project, created_at: timestamp)
    middle = create_activity(action: 'task_pinged', subject: @task, actor: @member, projectable: @project, created_at: timestamp)
    newest = create_activity(action: 'comment_created', subject: @task, actor: @member, projectable: @project, created_at: timestamp)

    get "/api/v1/activity?limit=2", as: :json
    assert_response :success
    assert_equal [newest.id, middle.id], payload_events.map { |event| event['id'] }
    assert payload['hasMore']
    assert_equal middle.id, payload['nextBefore']

    get "/api/v1/activity?limit=2&before=#{payload['nextBefore']}", as: :json
    assert_response :success
    assert_equal [oldest.id], payload_events.map { |event| event['id'] }
    refute payload['hasMore']
  end

  test 'deleted subject does not crash the feed' do
    deliberation = create_deliberation('À supprimer')
    event = create_activity(action: 'deliberation_opened', subject: deliberation, actor: @member, projectable: nil)
    deliberation.destroy!

    get "/api/v1/activity", as: :json
    assert_response :success

    serialized = payload_events.find { |item| item['id'] == event.id }
    assert_equal '(supprimé)', serialized.dig('subject', 'label')
  end

  private

  def payload
    JSON.parse(response.body)
  end

  def payload_events
    payload['events']
  end

  def create_activity(action:, subject:, actor:, projectable:, created_at: Time.current)
    ActivityEvent.create!(
      action: action,
      subject: subject,
      actor: actor,
      projectable: projectable,
      created_at: created_at,
      updated_at: created_at
    )
  end

  def create_deliberation(title)
    Strategy::Deliberation.create!(title: title, status: 'open', created_by_id: @other.id)
  end

  def create_member(first_name:)
    Member.create!(
      first_name: first_name,
      last_name: 'H',
      email: "#{first_name.downcase}-#{SecureRandom.hex(4)}@test.be",
      status: 'active',
      joined_at: Time.current,
      member_kind: 'human',
      membership_type: 'effective'
    )
  end
end
