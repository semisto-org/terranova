require 'test_helper'

# « Mon planning » (#142) : vue cross-projets agrégeant, pour le membre
# courant, ses events (où il est dans event_attendees) et ses tâches assignées
# (assignee_id) ayant une due_date. Les tâches legacy sans assignee_id sont
# exclues. Bascule mine/everyone + filtres projet/type.
class MyPlanningTest < ActionDispatch::IntegrationTest
  setup do
    @a = Member.create!(
      first_name: 'Aya', last_name: 'A', email: "aya-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human', membership_type: 'effective'
    )
    @b = Member.create!(
      first_name: 'Bilal', last_name: 'B', email: "bilal-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human', membership_type: 'effective'
    )
    Thread.current[:test_member] = @a

    @event_type = EventType.create!(label: "Réunion-#{SecureRandom.hex(3)}")

    # Deux projets ; A est membre des deux, B du premier seulement.
    @project1 = PoleProject.create!(name: 'Communication', pole: 'academy')
    @project2 = PoleProject.create!(name: 'Pépinière', pole: 'nursery')
    ProjectMembership.create!(projectable: @project1, member: @a, role: 'member')
    ProjectMembership.create!(projectable: @project2, member: @a, role: 'member')
    ProjectMembership.create!(projectable: @project1, member: @b, role: 'member')

    @list1 = TaskList.create!(name: 'À faire', taskable: @project1)
    @list2 = TaskList.create!(name: 'À faire', taskable: @project2)

    # Events : A attendu à l'un, B à l'autre.
    @event_a = create_event('Réunion de Aya', 2.days.from_now, @project1)
    @event_a.event_attendees.create!(member: @a)
    @event_b = create_event('Réunion de Bilal', 3.days.from_now, @project1)
    @event_b.event_attendees.create!(member: @b)

    # Tâches : assignée A datée, assignée B datée, legacy A sans assignee_id.
    @todo_a = @list1.tasks.create!(name: 'Tâche de Aya', status: 'pending',
                                   assignee_id: @a.id, due_date: 4.days.from_now.to_date)
    @todo_a_project2 = @list2.tasks.create!(name: 'Tâche pépinière Aya', status: 'pending',
                                            assignee_id: @a.id, due_date: 5.days.from_now.to_date)
    @todo_b = @list1.tasks.create!(name: 'Tâche de Bilal', status: 'pending',
                                   assignee_id: @b.id, due_date: 4.days.from_now.to_date)
    @legacy = @list1.tasks.create!(name: 'Tâche legacy', status: 'pending',
                                   assignee_name: 'Quelqu\'un', due_date: 4.days.from_now.to_date)
    # Tâche assignée A SANS date : exclue (pas d'échéance à planifier).
    @todo_a_nodate = @list1.tasks.create!(name: 'Sans date', status: 'pending', assignee_id: @a.id)
  end

  teardown { Thread.current[:test_member] = nil }

  test 'mine returns my attended events and my dated assigned tasks, excludes others and legacy' do
    get '/api/v1/my-planning', as: :json
    assert_response :success
    body = JSON.parse(response.body)

    ids = body['entries'].map { |e| e['id'] }
    sources = body['entries'].map { |e| e['source'] }.uniq.sort

    # Inclus : event de A + tâches datées de A (2 projets).
    assert_includes ids, @event_a.id.to_s
    assert_includes ids, "todo-#{@todo_a.id}"
    assert_includes ids, "todo-#{@todo_a_project2.id}"

    # Exclus : event de B, tâche de B, tâche legacy, tâche sans date.
    refute_includes ids, @event_b.id.to_s
    refute_includes ids, "todo-#{@todo_b.id}"
    refute_includes ids, "todo-#{@legacy.id}"
    refute_includes ids, "todo-#{@todo_a_nodate.id}"

    assert_equal %w[event todo], sources
  end

  test 'todo entries are all-day single-day calendar shape with project info' do
    get '/api/v1/my-planning', as: :json
    entry = JSON.parse(response.body)['entries'].find { |e| e['id'] == "todo-#{@todo_a.id}" }

    assert_equal 'todo', entry['source']
    assert_equal 'À faire', entry['type']
    assert_equal true, entry['allDay']
    assert_equal entry['startDate'], entry['endDate']
    assert_equal @todo_a.id.to_s, entry['taskId']
    assert_equal @a.id.to_s, entry['assigneeId']
    assert_equal 'Communication', entry['projectName']
    assert_equal 'lab-project', entry['projectType']
    assert_equal @project1.id.to_s, entry['projectId']
  end

  test 'projects list exposes the member projects for the filter' do
    get '/api/v1/my-planning', as: :json
    projects = JSON.parse(response.body)['projects']
    names = projects.map { |p| p['name'] }

    assert_includes names, 'Communication'
    assert_includes names, 'Pépinière'
    project = projects.find { |p| p['name'] == 'Communication' }
    assert_equal 'lab-project', project['type']
    assert_equal @project1.id.to_s, project['id']
  end

  test 'project filter keeps only the requested project' do
    get "/api/v1/my-planning?project=lab-project:#{@project1.id}", as: :json
    ids = JSON.parse(response.body)['entries'].map { |e| e['id'] }

    assert_includes ids, @event_a.id.to_s
    assert_includes ids, "todo-#{@todo_a.id}"
    # La tâche du projet 2 ne doit plus apparaître.
    refute_includes ids, "todo-#{@todo_a_project2.id}"
  end

  test 'types filter restricts entries to events only' do
    get '/api/v1/my-planning?types=events', as: :json
    sources = JSON.parse(response.body)['entries'].map { |e| e['source'] }.uniq

    assert_equal ['event'], sources
  end

  test 'types filter restricts entries to todos only' do
    get '/api/v1/my-planning?types=todos', as: :json
    sources = JSON.parse(response.body)['entries'].map { |e| e['source'] }.uniq

    assert_equal ['todo'], sources
  end

  test 'everyone mode includes other members entries within my projects' do
    get '/api/v1/my-planning?mode=everyone', as: :json
    ids = JSON.parse(response.body)['entries'].map { |e| e['id'] }

    # En everyone : on voit aussi l'event et la tâche de B (projet partagé).
    assert_includes ids, @event_b.id.to_s
    assert_includes ids, "todo-#{@todo_b.id}"
    # La legacy (sans assignee_id) reste exclue même en everyone.
    refute_includes ids, "todo-#{@legacy.id}"
  end

  private

  def create_event(title, start, projectable)
    Event.create!(title: title, event_type: @event_type, start_date: start,
                  end_date: start + 1.hour, projectable: projectable)
  end
end
