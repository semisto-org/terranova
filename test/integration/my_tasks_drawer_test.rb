require 'test_helper'

class MyTasksDrawerTest < ActionDispatch::IntegrationTest
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

  test 'my-tasks includes recently completed tasks so checking does not hide them' do
    active = @list.tasks.create!(name: 'À faire', status: 'pending', assignee_id: @member.id)
    recent = @list.tasks.create!(name: 'Faite hier', status: 'completed', assignee_id: @member.id, completed_at: 1.day.ago)
    old    = @list.tasks.create!(name: 'Faite il y a longtemps', status: 'completed', assignee_id: @member.id, completed_at: 60.days.ago)

    get '/api/v1/my-tasks', as: :json
    assert_response :success

    ids = JSON.parse(response.body)['projects'].flat_map { |p| p['tasks'] }.map { |t| t['id'] }
    assert_includes ids, active.id.to_s
    assert_includes ids, recent.id.to_s
    assert_not_includes ids, old.id.to_s
  end

  test 'serialized task carries project info, notes and tracking fields' do
    task = @list.tasks.create!(name: 'Tâche', status: 'pending', assignee_id: @member.id, notes: 'mes notes')

    get '/api/v1/my-tasks', as: :json
    payload = JSON.parse(response.body)['projects'].flat_map { |p| p['tasks'] }.find { |t| t['id'] == task.id.to_s }

    assert_equal 'lab-project', payload['projectType']
    assert_equal @project.id.to_s, payload['projectId']
    assert_equal 'Communication', payload['projectName']
    assert_equal 'mes notes', payload['notes']
    assert payload.key?('assignedAt')
    assert payload.key?('completedAt')
    assert payload.key?('starredAt')
  end

  # NB : rspec-openapi n'enregistre qu'UNE requête par exemple (la dernière) ;
  # star et ping vivent donc dans des exemples séparés pour que les DEUX
  # endpoints atterrissent dans la spec OpenAPI (sinon CI = drift).
  test 'star toggles the selection and returns 200' do
    task = @list.tasks.create!(name: 'Importante', status: 'pending', assignee_id: @member.id)

    patch "/api/v1/tasks/#{task.id}/star", as: :json
    assert_response :success
    assert_not_nil JSON.parse(response.body)['starredAt']
    assert_not_nil task.reload.starred_at

    patch "/api/v1/tasks/#{task.id}/star", as: :json
    assert_response :success
    assert_nil task.reload.starred_at
  end

  test 'ping toggles the coucou and stamps pinged_by, returns 200' do
    task = @list.tasks.create!(name: 'Coucou', status: 'pending', assignee_id: @member.id)

    patch "/api/v1/tasks/#{task.id}/ping", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_not_nil body['pingedAt']
    assert_equal @member.id.to_s, body['pingedBy']['id']
    assert_not_nil task.reload.pinged_at
  end

  test 'member-tasks returns a colleague task list so we can coucou it' do
    colleague = Member.create!(
      first_name: 'Ahmad', last_name: 'B', email: "ahmad-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human', membership_type: 'effective'
    )
    ProjectMembership.create!(projectable: @project, member: colleague, role: 'member')
    theirs = @list.tasks.create!(name: 'Tâche du collègue', status: 'pending', assignee_id: colleague.id)

    # @member (courant) consulte la liste d'Ahmad.
    get "/api/v1/member-tasks/#{colleague.id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal colleague.id.to_s, body['member']['id']
    ids = body['projects'].flat_map { |p| p['tasks'] }.map { |t| t['id'] }
    assert_includes ids, theirs.id.to_s

    # Coucou : @member fait remonter la tâche d'Ahmad.
    patch "/api/v1/tasks/#{theirs.id}/ping", as: :json
    assert_response :success
    assert_equal @member.id.to_s, JSON.parse(response.body)['pingedBy']['id']
  end

  test 'toggle stamps completed_by as current member' do
    task = @list.tasks.create!(name: 'À cocher', status: 'pending', assignee_id: @member.id)

    patch "/api/v1/tasks/#{task.id}/toggle", as: :json
    assert_response :success
    assert_equal 'completed', task.reload.status
    assert_equal @member.id, task.completed_by_id
    assert_not_nil task.completed_at
  end
end
