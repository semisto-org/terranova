require 'test_helper'

# Pipeline « de la réunion aux tâches » (#47) — substrat backend : compte-rendu
# (points proposés) → gate de validation → tâche assignée rattachée à la réunion
# et au projet, avec traçabilité. (UI suivie en #47b.)
class EventActionItemsTest < ActionDispatch::IntegrationTest
  setup do
    @member = Member.create!(
      first_name: 'Mo', last_name: 'H', email: "mo-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human',
      membership_type: 'effective', is_admin: true
    )
    Thread.current[:test_member] = @member
    @project = PoleProject.create!(name: 'Communication', pole: 'academy')
    @event_type = EventType.create!(label: "Réunion-#{SecureRandom.hex(3)}")
    @event = Event.create!(
      title: 'Réunion équipe', event_type: @event_type,
      start_date: Date.tomorrow, end_date: Date.tomorrow, projectable: @project
    )
  end

  teardown { Thread.current[:test_member] = nil }

  test 'a compte-rendu creates proposed action items' do
    assert_difference -> { EventActionItem.count }, 2 do
      post "/api/v1/events/#{@event.id}/action-items",
           params: { items: [{ description: 'Acheter des graines' }, { description: 'Réserver la salle' }] }, as: :json
    end
    assert_response :created
    items = JSON.parse(response.body)['items']
    assert items.all? { |i| i['status'] == 'proposed' }
  end

  test 'validating an item creates an assigned task linked to the meeting and project' do
    item = @event.action_items.create!(description: 'Préparer le terrain', status: 'proposed')

    assert_difference -> { Task.count }, 1 do
      patch "/api/v1/event-action-items/#{item.id}/validate", params: { assignee_id: @member.id }, as: :json
    end
    assert_response :success

    item.reload
    assert_equal 'validated', item.status
    task = Task.find(item.task_id)
    assert_equal @event.id, task.event_id           # provenance « vient de la réunion X » (#37)
    assert_equal @member.id, task.assignee_id
    assert_equal @member.id, task.assigned_by_id
    assert_includes @project.reload.unified_task_lists.flat_map(&:tasks).map(&:id), task.id
  end

  test 'a validated item cannot be validated twice' do
    item = @event.action_items.create!(description: 'Point unique', status: 'proposed')
    patch "/api/v1/event-action-items/#{item.id}/validate", as: :json
    assert_response :success

    assert_no_difference -> { Task.count } do
      patch "/api/v1/event-action-items/#{item.id}/validate", as: :json
    end
    assert_response :unprocessable_entity
  end

  test 'validation fails (no task created) when the meeting has no project' do
    orphan = Event.create!(title: 'Sans projet', event_type: @event_type, start_date: Date.tomorrow, end_date: Date.tomorrow)
    item = orphan.action_items.create!(description: 'Orphelin', status: 'proposed')

    assert_no_difference -> { Task.count } do
      patch "/api/v1/event-action-items/#{item.id}/validate", as: :json
    end
    assert_response :unprocessable_entity
  end

  test 'pending lists only items awaiting validation' do
    waiting = @event.action_items.create!(description: 'En attente', status: 'proposed')
    done = @event.action_items.create!(description: 'À valider puis faite', status: 'proposed')
    patch "/api/v1/event-action-items/#{done.id}/validate", as: :json

    get '/api/v1/event-action-items/pending', as: :json
    assert_response :success
    ids = JSON.parse(response.body)['items'].map { |i| i['id'] }
    assert_includes ids, waiting.id.to_s
    assert_not_includes ids, done.id.to_s
  end
end
