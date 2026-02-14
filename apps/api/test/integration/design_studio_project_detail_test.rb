require 'test_helper'

class DesignStudioProjectDetailTest < ActionDispatch::IntegrationTest
  setup do
    [
      Design::QuoteLine,
      Design::Quote,
      Design::Annotation,
      Design::MediaItem,
      Design::ProjectDocument,
      Design::Intervention,
      Design::FollowUpVisit,
      Design::PlantRecord,
      Design::PlantMarker,
      Design::PlantingPlan,
      Design::ClientContribution,
      Design::HarvestCalendar,
      Design::MaintenanceCalendar,
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

  test 'planting plan and co-gestion flows work' do
    patch "/api/v1/design/#{@project.id}/planting-plan", params: {
      image_url: 'https://example.com/plan.png',
      layout: 'split-3-4-1-4'
    }, as: :json
    assert_response :success
    plan = JSON.parse(response.body)
    assert_equal 'https://example.com/plan.png', plan['imageUrl']

    post "/api/v1/design/#{@project.id}/planting-plan/markers", params: {
      species_name: 'Malus domestica',
      x: 0.45,
      y: 0.72
    }, as: :json
    assert_response :created
    marker = JSON.parse(response.body)
    marker_id = marker['id']

    patch "/api/v1/design/planting-plan/markers/#{marker_id}", params: { x: 0.5, y: 0.8 }, as: :json
    assert_response :success
    marker = JSON.parse(response.body)
    assert_equal 0.5, marker['x']

    post "/api/v1/design/#{@project.id}/plant-records", params: {
      marker_id: marker_id,
      status: 'alive',
      health_score: 90,
      notes: 'Bonne reprise'
    }, as: :json
    assert_response :created
    record = JSON.parse(response.body)
    record_id = record['id']

    patch "/api/v1/design/plant-records/#{record_id}", params: {
      status: 'to-replace',
      notes: 'Stress hydrique'
    }, as: :json
    assert_response :success
    assert_equal 'to-replace', JSON.parse(response.body)['status']

    post "/api/v1/design/#{@project.id}/follow-up-visits", params: {
      date: Date.current.iso8601,
      visit_type: 'follow-up',
      notes: 'Passage mensuel'
    }, as: :json
    assert_response :created

    post "/api/v1/design/#{@project.id}/interventions", params: {
      date: Date.current.iso8601,
      intervention_type: 'mulching',
      notes: 'Paillage des fruitiers',
      plant_record_id: record_id
    }, as: :json
    assert_response :created

    get "/api/v1/design/#{@project.id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'https://example.com/plan.png', body['plantingPlan']['imageUrl']
    assert_equal 1, body['plantingPlan']['markers'].size
    assert_equal 1, body['plantFollowUp']['plantRecords'].size
    assert_equal 1, body['plantFollowUp']['followUpVisits'].size
    assert_equal 1, body['plantFollowUp']['interventions'].size

    delete "/api/v1/design/planting-plan/markers/#{marker_id}", as: :json
    assert_response :no_content
  end

  test 'planting plan export calendar updates and search work' do
    patch "/api/v1/design/#{@project.id}/planting-plan", params: {
      image_url: 'https://example.com/plan-final.png',
      layout: 'split-3-4-1-4'
    }, as: :json
    assert_response :success

    post "/api/v1/design/#{@project.id}/planting-plan/export", params: { format: 'pdf' }, as: :json
    assert_response :success
    export = JSON.parse(response.body)
    assert_equal 'pdf', export['format']
    assert_match %r{https://}, export['exportUrl']

    patch "/api/v1/design/#{@project.id}/harvest-calendar", params: {
      month: 6,
      items: [
        { product: 'fruits', species: 'Malus domestica', commonName: 'Pommier', notes: '' }
      ]
    }, as: :json
    assert_response :success
    harvest = JSON.parse(response.body)
    june = harvest['months'].find { |item| item['month'] == 6 }
    assert_equal 1, june['harvests'].size

    patch "/api/v1/design/#{@project.id}/maintenance-calendar", params: {
      month: 6,
      items: [
        { title: 'Paillage', description: 'Ajouter 5 cm', videoUrl: nil, photos: [] }
      ]
    }, as: :json
    assert_response :success
    maintenance = JSON.parse(response.body)
    june = maintenance['months'].find { |item| item['month'] == 6 }
    assert_equal 1, june['tasks'].size

    post "/api/v1/design/#{@project.id}/documents", params: {
      category: 'plan',
      name: 'Plan final',
      url: 'https://example.com/plan-final.pdf',
      size: 1024
    }, as: :json
    assert_response :created

    get "/api/v1/design/#{@project.id}/search", params: { q: 'plan final' }, as: :json
    assert_response :success
    search = JSON.parse(response.body)
    assert_operator search['results'].size, :>=, 1
  end

  test 'quote document media meeting and annotations flows work' do
    post "/api/v1/design/#{@project.id}/quotes", params: { title: 'Devis initial' }, as: :json
    assert_response :created
    quote_id = JSON.parse(response.body)['id']

    post "/api/v1/design/quotes/#{quote_id}/lines", params: {
      description: 'Plants',
      quantity: 10,
      unit: 'u',
      unit_price: 15
    }, as: :json
    assert_response :created
    line_id = JSON.parse(response.body)['id']

    patch "/api/v1/design/quotes/#{quote_id}/send", as: :json
    assert_response :success
    assert_equal 'sent', JSON.parse(response.body)['status']

    post "/api/v1/design/#{@project.id}/documents", params: {
      category: 'plan',
      name: 'Plan A3',
      url: 'https://example.com/plan-a3.pdf',
      size: 12_000,
      uploaded_by: 'team'
    }, as: :json
    assert_response :created
    document_id = JSON.parse(response.body)['id']

    post "/api/v1/design/#{@project.id}/media", params: {
      media_type: 'image',
      url: 'https://example.com/photo.jpg',
      thumbnail_url: 'https://example.com/photo-thumb.jpg',
      caption: 'Avant travaux',
      uploaded_by: 'team'
    }, as: :json
    assert_response :created
    media_id = JSON.parse(response.body)['id']

    post "/api/v1/design/#{@project.id}/meetings", params: {
      title: 'Kickoff',
      date: Date.current.iso8601,
      time: '09:00',
      duration: 60,
      location: 'Visio'
    }, as: :json
    assert_response :created
    meeting_id = JSON.parse(response.body)['id']

    post "/api/v1/design/#{@project.id}/annotations", params: {
      document_id: document_id,
      x: 0.25,
      y: 0.33,
      author_id: 'member-1',
      author_name: 'Alice',
      author_type: 'team',
      content: 'Déplacer la zone de plantation'
    }, as: :json
    assert_response :created
    annotation_id = JSON.parse(response.body)['id']

    patch "/api/v1/design/annotations/#{annotation_id}/resolve", as: :json
    assert_response :success
    assert_equal true, JSON.parse(response.body)['resolved']

    get "/api/v1/design/#{@project.id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['quotes'].size
    assert_equal 1, body['documents'].size
    assert_equal 1, body['mediaItems'].size
    assert_equal 1, body['meetings'].size
    assert_equal 1, body['annotations'].size

    delete "/api/v1/design/quote-lines/#{line_id}", as: :json
    assert_response :no_content
    delete "/api/v1/design/quotes/#{quote_id}", as: :json
    assert_response :no_content
    delete "/api/v1/design/documents/#{document_id}", as: :json
    assert_response :no_content
    delete "/api/v1/design/media/#{media_id}", as: :json
    assert_response :no_content
    delete "/api/v1/design/meetings/#{meeting_id}", as: :json
    assert_response :no_content
    delete "/api/v1/design/annotations/#{annotation_id}", as: :json
    assert_response :no_content
  end

  test 'client portal supports quote approval questionnaire wishlist and journal' do
    post "/api/v1/design/#{@project.id}/quotes", params: { title: 'Devis client' }, as: :json
    assert_response :created
    quote_id = JSON.parse(response.body)['id']

    patch "/api/v1/design/client/quotes/#{quote_id}/approve", params: {
      approved_by: 'client-portal',
      comment: 'Ok pour moi'
    }, as: :json
    assert_response :success
    quote = JSON.parse(response.body)
    assert_equal 'approved', quote['status']
    assert_equal 'client-portal', quote['approvedBy']

    patch "/api/v1/design/#{@project.id}/client/questionnaire", params: {
      sun_observations: 'plein sud',
      wet_areas: 'fond du terrain',
      wind_patterns: 'nord-est',
      soil_history: 'ancien potager',
      existing_wildlife: 'hérissons'
    }, as: :json
    assert_response :success
    contribution = JSON.parse(response.body)
    assert_equal 'plein sud', contribution['terrainQuestionnaire']['responses']['sunObservations']

    post "/api/v1/design/#{@project.id}/client/wishlist", params: {
      item_type: 'plant',
      description: 'Ajouter des petits fruits'
    }, as: :json
    assert_response :success
    contribution = JSON.parse(response.body)
    assert_equal 1, contribution['wishlist'].size

    post "/api/v1/design/#{@project.id}/client/journal", params: {
      plant_id: 'plant-1',
      species_name: 'Malus domestica',
      text: 'Bonne reprise'
    }, as: :json
    assert_response :success
    contribution = JSON.parse(response.body)
    assert_equal 1, contribution['plantJournal'].size

    get "/api/v1/design/#{@project.id}/client-portal", as: :json
    assert_response :success
    portal = JSON.parse(response.body)
    assert_equal @project.id.to_s, portal['project']['id']
    assert_equal 1, portal['quotes'].size
    assert_equal 1, portal['clientContributions']['wishlist'].size
    assert_equal 12, portal['harvestCalendar']['months'].size
    assert_equal 12, portal['maintenanceCalendar']['months'].size
  end
end
