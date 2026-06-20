require 'test_helper'

# Lien tâche ↔ réunion (#37) : « amener une tâche en réunion » (FK simple
# event_id), sélecteur des réunions à venir où le membre est convié, et ordre
# du jour (tâches rattachées) exposé sur la fiche de la réunion.
class TaskMeetingLinkTest < ActionDispatch::IntegrationTest
  setup do
    @me = Member.create!(
      first_name: 'Mo', last_name: 'Hammad', email: "mo-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human',
      membership_type: 'effective', is_admin: true
    )
    Thread.current[:test_member] = @me

    @project = PoleProject.create!(name: 'Communication', pole: 'academy')
    @list = TaskList.create!(name: 'À faire', taskable: @project)
    @task = @list.tasks.create!(name: 'Préparer le point', status: 'pending')

    @event_type = EventType.create!(label: "Réunion-#{SecureRandom.hex(3)}")
    @upcoming = create_event('Réunion lundi', 2.days.from_now)
    @upcoming.event_attendees.create!(member: @me)
  end

  teardown { Thread.current[:test_member] = nil }

  test 'a task is brought to a meeting through PATCH event_id' do
    patch "/api/v1/tasks/#{@task.id}", params: { event_id: @upcoming.id }, as: :json
    assert_response :success

    payload = JSON.parse(response.body)
    assert_equal @upcoming.id.to_s, payload['eventId']
    assert_equal 'Réunion lundi', payload['eventTitle']
    assert_equal @upcoming.id, @task.reload.event_id
  end

  test 'sending a blank event_id detaches the task from its meeting' do
    @task.update!(event: @upcoming)
    patch "/api/v1/tasks/#{@task.id}", params: { event_id: '' }, as: :json
    assert_response :success

    assert_nil JSON.parse(response.body)['eventId']
    assert_nil @task.reload.event_id
  end

  test 'meeting-options lists only upcoming meetings the member attends' do
    past = create_event('Réunion passée', 3.days.ago)
    past.event_attendees.create!(member: @me)
    not_invited = create_event('Réunion sans moi', 2.days.from_now)

    get '/api/v1/tasks/meeting-options', as: :json
    assert_response :success

    ids = JSON.parse(response.body)['items'].map { |e| e['id'] }
    assert_includes ids, @upcoming.id.to_s
    refute_includes ids, past.id.to_s, 'une réunion passée ne doit pas être proposée'
    refute_includes ids, not_invited.id.to_s, 'une réunion sans le membre ne doit pas être proposée'
  end

  test 'the meeting detail exposes its agenda (linked tasks)' do
    @task.update!(event: @upcoming)

    get "/api/v1/lab/events/#{@upcoming.id}", as: :json
    assert_response :success

    payload = JSON.parse(response.body)
    agenda = payload['tasks']
    assert_equal [@task.id.to_s], agenda.map { |t| t['id'] }
    assert_equal 'Préparer le point', agenda.first['name']
    assert_equal 'pending', agenda.first['status']
  end

  private

  def create_event(title, start)
    Event.create!(title: title, event_type: @event_type, start_date: start, end_date: start + 1.hour)
  end
end
