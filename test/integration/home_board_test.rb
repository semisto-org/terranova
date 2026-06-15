require 'test_helper'

# Couvre la grille « Mon accueil » (#108) : endpoint board, persistance
# épinglage/ordre par membre, et marquage de visite (point d'activité).
#
# NB OpenAPI : rspec-openapi n'enregistre qu'UNE requête par exemple (la
# DERNIÈRE). Chaque endpoint à documenter (board GET, reorder PATCH, visit POST)
# doit donc être la dernière requête d'un exemple dédié, sinon il manque à la
# spec et CI signale un drift.
class HomeBoardTest < ActionDispatch::IntegrationTest
  setup do
    @member = Member.create!(
      first_name: 'Mo', last_name: 'H', email: "mo-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human', membership_type: 'effective'
    )
    Thread.current[:test_member] = @member

    @alpha = PoleProject.create!(name: 'Alpha', pole: 'academy')
    @beta = PoleProject.create!(name: 'Beta', pole: 'academy')
    @foreign = PoleProject.create!(name: 'Pas la mienne', pole: 'academy')
    ProjectMembership.create!(projectable: @alpha, member: @member, role: 'member')
    ProjectMembership.create!(projectable: @beta, member: @member, role: 'member')

    list = TaskList.create!(name: 'À faire', taskable: @alpha)
    Task.create!(name: 'T1', task_list: list, status: 'completed')
    Task.create!(name: 'T2', task_list: list, status: 'pending')
  end

  teardown { Thread.current[:test_member] = nil }

  test 'board returns only my projects, with type accent, task counts and activity flag' do
    get '/api/v1/my-projects/board', as: :json
    assert_response :success

    projects = JSON.parse(response.body)['projects']
    names = projects.map { |p| p['name'] }
    assert_includes names, 'Alpha'
    assert_includes names, 'Beta'
    assert_not_includes names, 'Pas la mienne'

    alpha = projects.find { |p| p['name'] == 'Alpha' }
    assert_equal 'lab-project', alpha['typeKey']
    assert_equal '#5B5781', alpha['accent']
    assert_equal 2, alpha['totalTasks']
    assert_equal 1, alpha['completedTasks']
    # Jamais visité → point d'activité allumé.
    assert alpha['hasActivity'], 'un projet jamais visité doit être marqué actif'
    assert_nil alpha['pinnedAt']
  end

  # Dernière requête = PATCH reorder → c'est lui qui atterrit dans la spec.
  test 'reorder persists pin and position per member' do
    patch '/api/v1/my-projects/reorder',
          params: {
            items: [
              { type: 'lab-project', id: @beta.id.to_s, pinned: true },
              { type: 'lab-project', id: @alpha.id.to_s, pinned: false }
            ]
          }, as: :json
    assert_response :no_content

    beta_membership = ProjectMembership.find_by(projectable: @beta, member: @member)
    alpha_membership = ProjectMembership.find_by(projectable: @alpha, member: @member)
    assert_not_nil beta_membership.pinned_at
    assert_equal 0, beta_membership.position
    assert_nil alpha_membership.pinned_at
    assert_equal 1, alpha_membership.position
  end

  test 'board lists pinned projects first after reorder' do
    patch '/api/v1/my-projects/reorder',
          params: {
            items: [
              { type: 'lab-project', id: @beta.id.to_s, pinned: true },
              { type: 'lab-project', id: @alpha.id.to_s, pinned: false }
            ]
          }, as: :json
    assert_response :no_content

    get '/api/v1/my-projects/board', as: :json
    projects = JSON.parse(response.body)['projects']
    assert_equal 'Beta', projects.first['name']
    assert_not_nil projects.first['pinnedAt']
  end

  # Dernière requête = POST visit (succès) → enregistre la réponse 204.
  test 'visit marks the project as seen for the current member' do
    post "/api/v1/my-projects/lab-project/#{@alpha.id}/visit", as: :json
    assert_response :no_content

    membership = ProjectMembership.find_by(projectable: @alpha, member: @member)
    assert_not_nil membership.last_visited_at
  end

  test 'board clears the activity flag after a visit' do
    post "/api/v1/my-projects/lab-project/#{@alpha.id}/visit", as: :json
    assert_response :no_content

    get '/api/v1/my-projects/board', as: :json
    alpha = JSON.parse(response.body)['projects'].find { |p| p['name'] == 'Alpha' }
    assert_not alpha['hasActivity'], 'après visite, sans nouveau changement, plus d’activité'
  end

  test 'visit on an unknown project type is rejected' do
    post '/api/v1/my-projects/not-a-type/1/visit', as: :json
    assert_response :not_found
  end
end
