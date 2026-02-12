require 'test_helper'

class DesignStudioProjectDetailTest < ActionDispatch::IntegrationTest
  setup do
    [
      Design::ProjectPaletteItem,
      Design::ProjectPalette,
      Design::SiteAnalysis,
      Design::Expense,
      Design::ProjectTimesheet,
      Design::TeamMember,
      Design::ProjectMeeting,
      Design::Project,
      Design::ProjectTemplate,
      Plant::PaletteItem,
      Plant::Palette,
      Plant::Species,
      Plant::Genus
    ].each(&:delete_all)

    @project = Design::Project.create!(
      name: 'Projet detail test',
      client_id: 'client-1',
      client_name: 'Client Test',
      client_email: 'client@test.com',
      client_phone: '000',
      place_id: 'place-1',
      address: 'Rue test',
      latitude: 50.0,
      longitude: 4.0,
      area: 1000,
      phase: 'offre',
      status: 'pending',
      project_manager_id: 'member-1'
    )

    @genus = Plant::Genus.create!(latin_name: 'Malus', description: 'Pommiers')
    @species = Plant::Species.create!(
      genus: @genus,
      latin_name: 'Malus domestica',
      plant_type: 'tree',
      exposures: ['sun'],
      hardiness: 'zone-7',
      edible_parts: ['fruit'],
      interests: ['edible']
    )

    @plant_palette = Plant::Palette.create!(name: 'Palette source', description: 'source', created_by: 'tester')
    @plant_palette.items.create!(item_type: 'species', item_id: @species.id, strate_key: 'trees', position: 0)
  end

  test 'show project returns detail payload blocks' do
    get "/api/v1/design/#{@project.id}", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal @project.name, body['project']['name']
    assert body.key?('teamMembers')
    assert body.key?('timesheets')
    assert body.key?('expenses')
    assert body.key?('siteAnalysis')
    assert body.key?('plantPalette')
  end

  test 'team member crud works' do
    post "/api/v1/design/#{@project.id}/team-members", params: {
      member_id: 'member-42',
      member_name: 'Test Member',
      member_email: 'm@test.com',
      role: 'designer',
      is_paid: true
    }, as: :json
    assert_response :created
    item_id = JSON.parse(response.body)['id']

    delete "/api/v1/design/#{@project.id}/team-members/#{item_id}", as: :json
    assert_response :no_content
  end

  test 'timesheet and expense flows work' do
    post "/api/v1/design/#{@project.id}/timesheets", params: {
      member_id: 'member-1',
      member_name: 'User',
      date: Date.current,
      hours: 3.5,
      phase: 'offre',
      mode: 'billed',
      travel_km: 4,
      notes: 'session'
    }, as: :json
    assert_response :created
    ts_id = JSON.parse(response.body)['id']

    patch "/api/v1/design/timesheets/#{ts_id}", params: { notes: 'updated' }, as: :json
    assert_response :success

    post "/api/v1/design/#{@project.id}/expenses", params: {
      date: Date.current,
      amount: 120,
      category: 'plants',
      description: 'achat',
      phase: 'offre',
      member_id: 'member-1',
      member_name: 'User',
      status: 'pending'
    }, as: :json
    assert_response :created
    expense_id = JSON.parse(response.body)['id']

    patch "/api/v1/design/expenses/#{expense_id}/approve", as: :json
    assert_response :success
    assert_equal 'approved', JSON.parse(response.body)['status']
  end

  test 'site analysis and palette import from plant database work' do
    patch "/api/v1/design/#{@project.id}/site-analysis", params: {
      climate: { hardinessZone: 'H7' },
      soil: { type: 'loam' }
    }, as: :json
    assert_response :success
    assert_equal 'H7', JSON.parse(response.body)['climate']['hardinessZone']

    post "/api/v1/design/#{@project.id}/palette/import/#{@plant_palette.id}", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_operator body['items'].size, :>=, 1
    assert_equal 'Malus domestica', body['items'].first['speciesName']
  end
end
