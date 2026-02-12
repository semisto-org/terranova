require 'test_helper'

class DesignStudioDashboardTest < ActionDispatch::IntegrationTest
  setup do
    [
      Design::ProjectMeeting,
      Design::Project,
      Design::ProjectTemplate
    ].each(&:delete_all)

    @template = Design::ProjectTemplate.create!(
      name: 'Verger urbain',
      description: 'Template orienté jardin-forêt urbain',
      default_phases: %w[offre pre-projet],
      suggested_hours: 120,
      suggested_budget: 6500
    )

    @project = Design::Project.create!(
      name: 'Jardin-forêt Dupont',
      client_id: 'client-dupont',
      client_name: 'Jean Dupont',
      client_email: 'jean@example.com',
      client_phone: '+32 470 00 00 00',
      place_id: 'place-dupont',
      address: 'Rue des Tilleuls 12, Namur',
      latitude: 50.463,
      longitude: 4.867,
      area: 2500,
      phase: 'projet-detaille',
      status: 'active',
      project_manager_id: 'member-1',
      template: @template,
      hours_planned: 120,
      hours_worked: 45,
      hours_billed: 30,
      hours_semos: 15,
      expenses_budget: 6500,
      expenses_actual: 2100
    )

    Design::ProjectMeeting.create!(
      project: @project,
      title: 'Réunion client',
      starts_at: 2.days.from_now.change(hour: 10, min: 30),
      duration_minutes: 90,
      location: 'Visio'
    )
  end

  test 'dashboard returns projects stats templates and meetings' do
    get '/api/v1/design', as: :json
    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body['projects'].size
    assert_equal 'Jardin-forêt Dupont', body['projects'][0]['name']

    assert_equal 1, body['stats']['activeProjects']
    assert_equal 1, body['stats']['totalProjects']
    assert_operator body['stats']['upcomingMeetings'].size, :>=, 1

    assert_equal 1, body['templates'].size
    assert_equal 'Verger urbain', body['templates'][0]['name']
  end

  test 'create project from template applies defaults and starts in offre' do
    post '/api/v1/design', params: {
      template_id: @template.id,
      name: 'Nouveau projet test',
      client_name: 'Client Test',
      client_email: 'client@test.com',
      client_phone: '+33 6 00 00 00 00',
      address: 'Avenue des Plantes 5',
      area: 900
    }, as: :json

    assert_response :created

    body = JSON.parse(response.body)
    assert_equal 'Nouveau projet test', body['name']
    assert_equal 'offre', body['phase']
    assert_equal @template.id.to_s, body['templateId']
    assert_equal 120, body['budget']['hoursPlanned']
    assert_equal 6500.0, body['budget']['expensesBudget']
  end

  test 'delete project removes it from dashboard' do
    delete "/api/v1/design/#{@project.id}", as: :json
    assert_response :no_content

    get '/api/v1/design', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 0, body['projects'].size
    assert_equal 0, body['stats']['totalProjects']
  end

  test 'duplicate project creates a pending offre copy' do
    post "/api/v1/design/#{@project.id}/duplicate", as: :json
    assert_response :created

    body = JSON.parse(response.body)
    assert_match(/\(copie\)\z/, body['name'])
    assert_equal 'offre', body['phase']
    assert_equal 'pending', body['status']
  end
end
