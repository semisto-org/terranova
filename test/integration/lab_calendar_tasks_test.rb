require 'test_helper'

# To-dos datés sur le calendrier (#141, tranche 109a de l'epic #101).
# L'endpoint calendrier sérialise désormais les `tasks` ayant une `due_date`
# (en plus des `events`), avec un discriminant `kind` ("task" vs "event") et le
# lien vers le projet parent (clic → projet + drawer). Les tâches legacy sans
# `assignee_id` et les tâches sans `due_date` restent hors scope.
class LabCalendarTasksTest < ActionDispatch::IntegrationTest
  setup do
    @member = Member.create!(
      first_name: 'Mo', last_name: 'H', email: "mo-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human', membership_type: 'effective'
    )
    Thread.current[:test_member] = @member

    @project = PoleProject.create!(name: 'Communication', pole: 'academy')
    ProjectMembership.create!(projectable: @project, member: @member, role: 'member')
    @list = TaskList.create!(name: 'À faire', taskable: @project)
  end

  teardown { Thread.current[:test_member] = nil }

  def calendar_tasks
    get '/api/v1/lab/calendar', as: :json
    assert_response :success
    JSON.parse(response.body).fetch('tasks')
  end

  test 'a dated to-do is serialized with kind=task and its parent project link' do
    task = @list.tasks.create!(
      name: 'Rédiger la newsletter', status: 'pending',
      assignee_id: @member.id, due_date: Date.tomorrow, priority: 'high'
    )

    entry = calendar_tasks.find { |t| t['id'] == task.id.to_s }
    assert_not_nil entry, 'la tâche datée doit apparaître dans le payload calendrier'
    assert_equal 'task', entry['kind']
    assert_equal 'Rédiger la newsletter', entry['title']
    assert_equal Date.tomorrow.iso8601, entry['dueDate']
    assert_equal 'high', entry['priority']
    assert_equal @member.id.to_s, entry['assigneeId']
    assert_equal 'lab-project', entry['projectType']
    assert_equal @project.id.to_s, entry['projectId']
    assert_equal 'Communication', entry['projectName']
  end

  test 'a project with both an event and an overdue task yields both, each with its kind' do
    event_type = EventType.create!(label: "Réunion-#{SecureRandom.hex(3)}")
    Event.create!(
      title: 'Journée collective', event_type: event_type,
      start_date: Date.tomorrow, end_date: Date.tomorrow, projectable: @project
    )
    overdue = @list.tasks.create!(
      name: 'Tâche en retard', status: 'pending',
      assignee_id: @member.id, due_date: Date.yesterday
    )

    get '/api/v1/lab/calendar', as: :json
    assert_response :success
    body = JSON.parse(response.body)

    assert body['events'].any? { |e| e['kind'] == 'event' }, 'les events portent kind=event'
    assert(body['tasks'].any? { |t| t['id'] == overdue.id.to_s && t['kind'] == 'task' },
           'la tâche échue est présente avec kind=task')
  end

  test 'tasks without due_date or without assignee_id are excluded' do
    no_due = @list.tasks.create!(name: 'Sans échéance', status: 'pending', assignee_id: @member.id)
    # Tâche legacy en texte libre : pas d'assignee_id (hors scope).
    legacy = @list.tasks.create!(
      name: 'Legacy non assignée', status: 'pending',
      assignee_name: 'Quelqu’un', due_date: Date.tomorrow
    )

    ids = calendar_tasks.map { |t| t['id'] }
    assert_not_includes ids, no_due.id.to_s
    assert_not_includes ids, legacy.id.to_s
  end
end
