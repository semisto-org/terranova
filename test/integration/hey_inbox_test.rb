require 'test_helper'

# Boîte « Hey! » (#105, epic #101) — lecture directed-at-me des Notification.
# Couvre : périmètre strictement personnel (ANTI-critère : l'activité non
# adressée n'apparaît JAMAIS dans le Hey!), tri non-lus d'abord, compteur,
# marquage lu unitaire et global, isolation entre membres.
#
# NB rspec-openapi (Minitest) : seule la DERNIÈRE requête de chaque test est
# enregistrée → un test par (chemin, verbe) à documenter.
class HeyInboxTest < ActionDispatch::IntegrationTest
  setup do
    @me = create_member(first_name: 'Ada')
    @other = create_member(first_name: 'Boris')
    Thread.current[:test_member] = @me

    @project = PoleProject.create!(name: 'Communication', pole: 'academy')
    [@me, @other].each { |m| ProjectMembership.create!(projectable: @project, member: m, role: 'member') }
    @list = TaskList.create!(name: 'À faire', taskable: @project)
    @task = @list.tasks.create!(name: 'Préparer la réunion', status: 'pending')
  end

  teardown { Thread.current[:test_member] = nil }

  test 'the inbox lists only what is addressed to me — ambient activity never leaks in' do
    # Adressé à moi : assignation par Boris.
    @task.update!(assignee: @me, assigned_by: @other)
    # Activité ambiante NON adressée : Boris commente une tâche que je ne suis pas.
    other_task = @list.tasks.create!(name: 'Autre sujet', status: 'pending')
    other_task.comments.create!(author: @other, body: '<p>sans moi</p>')
    # Adressé à Boris uniquement : auto-notification d'assignation par moi.
    third = @list.tasks.create!(name: 'Pour Boris', status: 'pending')
    third.update!(assignee: @other, assigned_by: @me)

    get '/api/v1/notifications', as: :json
    assert_response :success

    payload = JSON.parse(response.body)
    kinds = payload['notifications'].map { |n| [n['kind'], n['subject']['label']] }
    assert_equal [['assignment', 'Préparer la réunion']], kinds,
      "le Hey! ne contient QUE ce qui m'est adressé (ni l'ambient, ni les notifs des autres)"
    assert_equal 1, payload['unreadCount']
    assert_equal '/projects/lab-project/' + @project.id.to_s, payload['notifications'].first['url']
  end

  test 'unread notifications come first' do
    @task.update!(assignee: @me, assigned_by: @other)
    read = Notification.where(recipient_id: @me.id).last
    read.mark_read!
    @task.update!(pinged_at: Time.current, pinged_by: @other)

    get '/api/v1/notifications', as: :json
    payload = JSON.parse(response.body)['notifications']
    assert_nil payload.first['readAt'], 'non-lu en premier'
    refute_nil payload.last['readAt']
  end

  test 'unread count endpoint' do
    @task.update!(assignee: @me, assigned_by: @other)

    get '/api/v1/notifications/unread-count', as: :json
    assert_response :success
    assert_equal 1, JSON.parse(response.body)['count']
  end

  test 'marking a notification as read' do
    @task.update!(assignee: @me, assigned_by: @other)
    notification = Notification.where(recipient_id: @me.id).last

    patch "/api/v1/notifications/#{notification.id}/read", as: :json
    assert_response :success
    refute_nil notification.reload.read_at
  end

  test 'i cannot mark another member notification as read' do
    @task.update!(assignee: @other, assigned_by: @me)
    Thread.current[:test_member] = @me
    foreign = Notification.where(recipient_id: @other.id).last

    patch "/api/v1/notifications/#{foreign.id}/read", as: :json
    assert_response :not_found
    assert_nil foreign.reload.read_at
  end

  test 'mark all as read' do
    @task.update!(assignee: @me, assigned_by: @other)
    @task.update!(pinged_at: Time.current, pinged_by: @other)
    assert_operator Notification.where(recipient_id: @me.id).unread.count, :>=, 2

    patch '/api/v1/notifications/read-all', as: :json
    assert_response :success
    assert_equal 0, Notification.where(recipient_id: @me.id).unread.count
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
