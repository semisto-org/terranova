require 'test_helper'

class StrategyTest < ActionDispatch::IntegrationTest
  setup do
    [
      Strategy::KeyResult,
      Strategy::Axis,
      Strategy::Framework,
      Strategy::DeliberationComment,
      Strategy::Reaction,
      Strategy::ProposalVersion,
      Strategy::Proposal,
      Strategy::Deliberation,
      Strategy::Resource
    ].each(&:delete_all)
  end

  teardown do
    Thread.current[:test_member] = nil
  end

  def ensure_member(email:, membership_type:, admin: false)
    Member.find_or_create_by!(email: email) do |m|
      m.first_name = "Test"
      m.last_name  = "User"
      m.status     = "active"
      m.joined_at  = Date.today
      m.password   = "terranova2026"
      m.membership_type = membership_type
      m.is_admin   = admin
    end.tap { |m| m.update!(membership_type: membership_type, is_admin: admin) }
  end

  def login_as(member)
    Thread.current[:test_member] = member
  end

  # ─── Resources ───

  test 'resources CRUD lifecycle' do
    # Create
    post '/api/v1/strategy/resources', params: {
      title: 'Designing Regenerative Cultures',
      summary: 'Daniel Christian Wahl — référence clé',
      resource_type: 'reference',
      source_url: 'https://example.com/book',
      tags: ['gouvernance', 'régénératif']
    }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    resource_id = body['resource']['id']
    assert_equal 'Designing Regenerative Cultures', body['resource']['title']
    assert_equal 'reference', body['resource']['resourceType']
    assert_equal ['gouvernance', 'régénératif'], body['resource']['tags']

    # List
    get '/api/v1/strategy/resources', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['resources'].size

    # List with filter
    get '/api/v1/strategy/resources?resource_type=article', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 0, body['resources'].size

    get '/api/v1/strategy/resources?resource_type=reference', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['resources'].size

    # Search
    get '/api/v1/strategy/resources?search=regenerative', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['resources'].size

    # Show
    get "/api/v1/strategy/resources/#{resource_id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'Designing Regenerative Cultures', body['resource']['title']
    assert body['resource'].key?('content')

    # Update
    patch "/api/v1/strategy/resources/#{resource_id}", params: {
      title: 'Designing Regenerative Cultures (updated)'
    }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'Designing Regenerative Cultures (updated)', body['resource']['title']

    # Pin toggle
    patch "/api/v1/strategy/resources/#{resource_id}/pin", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal true, body['resource']['pinned']

    patch "/api/v1/strategy/resources/#{resource_id}/pin", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal false, body['resource']['pinned']

    # Delete
    delete "/api/v1/strategy/resources/#{resource_id}", as: :json
    assert_response :no_content

    get '/api/v1/strategy/resources', as: :json
    body = JSON.parse(response.body)
    assert_equal 0, body['resources'].size
  end

  # ─── Deliberations ───

  test 'effective member can create draft deliberation' do
    effective = ensure_member(email: "effective@test.local", membership_type: "effective", admin: true)
    login_as(effective)

    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 'draft', body['deliberation']['status']
    assert_nil body['deliberation']['openedAt']
  end

  test 'adherent member receives 403 on deliberations index' do
    adherent = ensure_member(email: "adherent@test.local", membership_type: "adherent")
    login_as(adherent)

    get '/api/v1/strategy/deliberations', as: :json
    assert_response :forbidden
  end

  test 'non_member receives 403 on deliberations create' do
    non_member = ensure_member(email: "non@test.local", membership_type: "non_member")
    login_as(non_member)

    post '/api/v1/strategy/deliberations', params: { title: 'Test' }, as: :json
    assert_response :forbidden
  end

  test 'draft is visible only to its author' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    other  = ensure_member(email: "other@test.local",  membership_type: "effective")

    login_as(author)
    post '/api/v1/strategy/deliberations', params: { title: 'Mon brouillon' }, as: :json
    my_id = JSON.parse(response.body)['deliberation']['id']

    login_as(other)
    get '/api/v1/strategy/deliberations', as: :json
    ids = JSON.parse(response.body)['deliberations'].map { |d| d['id'] }
    assert_not_includes ids, my_id

    get "/api/v1/strategy/deliberations/#{my_id}", as: :json
    assert_response :not_found
  end

  test 'publish requires a proposal' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    patch "/api/v1/strategy/deliberations/#{delib_id}/publish", as: :json
    assert_response :unprocessable_entity
  end

  test 'full phase progression: draft to decided' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    voter  = ensure_member(email: "voter@test.local",  membership_type: "effective")

    login_as(author)
    post '/api/v1/strategy/deliberations', params: { title: 'Protocole de membrane' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    post "/api/v1/strategy/deliberations/#{delib_id}/proposals",
      params: { content: '<p>Seuil local 5000 euros</p>' }, as: :json
    assert_response :created

    patch "/api/v1/strategy/deliberations/#{delib_id}/publish", as: :json
    assert_response :success
    assert_equal 'open', JSON.parse(response.body)['deliberation']['status']

    ::Strategy::Deliberation.find(delib_id).update!(opened_at: 16.days.ago)
    Rails.application.load_tasks if Rake::Task.tasks.empty?
    Rake::Task["strategy:advance_deliberations"].reenable
    Rake::Task["strategy:advance_deliberations"].invoke
    get "/api/v1/strategy/deliberations/#{delib_id}", as: :json
    assert_equal 'voting', JSON.parse(response.body)['deliberation']['status']

    proposal_id = JSON.parse(response.body)['deliberation']['proposals'][0]['id']
    login_as(voter)
    post "/api/v1/strategy/proposals/#{proposal_id}/reactions",
      params: { position: 'objection', rationale: 'Seuil trop bas pour IDF' }, as: :json
    assert_response :created

    delib_row = ::Strategy::Deliberation.find(delib_id)
    assert delib_row.voting_deadline > Time.current + 6.days

    delib_row.update!(voting_deadline: 1.minute.ago)
    Rake::Task["strategy:advance_deliberations"].reenable
    Rake::Task["strategy:advance_deliberations"].invoke
    get "/api/v1/strategy/deliberations/#{delib_id}", as: :json
    assert_equal 'outcome_pending', JSON.parse(response.body)['deliberation']['status']

    login_as(author)
    patch "/api/v1/strategy/deliberations/#{delib_id}/decide",
      params: { outcome: '<p>Seuil adopte a 5000 euros avec exception IDF.</p>' }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'decided', body['deliberation']['status']
    assert body['deliberation']['decidedAt'].present?
  end

  test 'update deliberation title allowed in draft, forbidden in open' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    post '/api/v1/strategy/deliberations', params: { title: 'v1' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    patch "/api/v1/strategy/deliberations/#{delib_id}", params: { title: 'v2' }, as: :json
    assert_response :success

    post "/api/v1/strategy/deliberations/#{delib_id}/proposals",
      params: { content: '<p>proposition</p>' }, as: :json
    patch "/api/v1/strategy/deliberations/#{delib_id}/publish", as: :json

    patch "/api/v1/strategy/deliberations/#{delib_id}", params: { title: 'v3' }, as: :json
    assert_response :forbidden
  end

  test 'update_proposal allowed in draft and open, creates versions' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    post "/api/v1/strategy/deliberations/#{delib_id}/proposals",
      params: { content: '<p>v1</p>' }, as: :json
    proposal_id = JSON.parse(response.body)['proposal']['id']

    patch "/api/v1/strategy/proposals/#{proposal_id}",
      params: { content: '<p>v2</p>' }, as: :json
    assert_response :success
    assert_equal 2, JSON.parse(response.body)['proposal']['version']

    patch "/api/v1/strategy/deliberations/#{delib_id}/publish", as: :json
    patch "/api/v1/strategy/proposals/#{proposal_id}",
      params: { content: '<p>v3</p>' }, as: :json
    assert_response :success
    assert_equal 3, JSON.parse(response.body)['proposal']['version']

    get "/api/v1/strategy/proposals/#{proposal_id}/versions", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal [1, 2, 3], body['versions'].map { |v| v['version'] }
  end

  test 'update_proposal forbidden for non-author' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    other  = ensure_member(email: "other@test.local",  membership_type: "effective")

    login_as(author)
    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']
    post "/api/v1/strategy/deliberations/#{delib_id}/proposals",
      params: { content: '<p>v1</p>' }, as: :json
    proposal_id = JSON.parse(response.body)['proposal']['id']

    login_as(other)
    patch "/api/v1/strategy/proposals/#{proposal_id}",
      params: { content: '<p>hijack</p>' }, as: :json
    assert_response :forbidden
  end

  test 'cancel works in any non-decided phase' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    patch "/api/v1/strategy/deliberations/#{delib_id}/cancel", as: :json
    assert_response :success
    assert_equal 'cancelled', JSON.parse(response.body)['deliberation']['status']
  end

  test 'cancel rejected when deliberation is decided' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    delib = Strategy::Deliberation.create!(title: 'Already decided', created_by_id: author.id, status: 'decided')
    patch "/api/v1/strategy/deliberations/#{delib.id}/cancel", as: :json
    assert_response :unprocessable_entity
  end

  test 'comments grouped by phase' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    post "/api/v1/strategy/deliberations/#{delib_id}/comments", params: { content: 'Draft remark' }, as: :json

    post "/api/v1/strategy/deliberations/#{delib_id}/proposals",
      params: { content: '<p>v1</p>' }, as: :json
    patch "/api/v1/strategy/deliberations/#{delib_id}/publish", as: :json
    post "/api/v1/strategy/deliberations/#{delib_id}/comments", params: { content: 'Open remark' }, as: :json

    get "/api/v1/strategy/deliberations/#{delib_id}/comments", as: :json
    assert_response :success
    payload = JSON.parse(response.body)['commentsByPhase']
    assert_equal 1, payload['draft'].size
    assert_equal 1, payload['open'].size
    assert_equal 'Draft remark', payload['draft'][0]['content']
    assert_equal 'Open remark',  payload['open'][0]['content']
  end

  test 'deliberation destroy route no longer exists' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    assert_raises(ActionController::RoutingError) do
      delete "/api/v1/strategy/deliberations/#{delib_id}", as: :json
    end
  end

  # ─── Frameworks ───

  test 'frameworks CRUD with deliberation link' do
    # Create a decided deliberation first
    author = ensure_member(email: "framework-author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    delib = Strategy::Deliberation.create!(title: 'Charte des valeurs', created_by_id: author.id, status: 'outcome_pending')
    delib_id = delib.id
    patch "/api/v1/strategy/deliberations/#{delib_id}/decide", params: {
      outcome: 'Valeurs adoptées.'
    }, as: :json
    assert_response :success

    # Create framework
    post '/api/v1/strategy/frameworks', params: {
      title: 'Charte des valeurs Semisto',
      content: '<h2>Valeurs</h2><p>Régénération, autonomie, entraide.</p>',
      framework_type: 'charter',
      status: 'draft',
      deliberation_id: delib_id
    }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    fw_id = body['framework']['id']
    assert_equal 'charter', body['framework']['frameworkType']
    assert_equal 'draft', body['framework']['status']
    assert_equal delib_id, body['framework']['deliberationId']

    # List
    get '/api/v1/strategy/frameworks', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['frameworks'].size

    # Filter by type
    get '/api/v1/strategy/frameworks?framework_type=protocol', as: :json
    body = JSON.parse(response.body)
    assert_equal 0, body['frameworks'].size

    get '/api/v1/strategy/frameworks?framework_type=charter', as: :json
    body = JSON.parse(response.body)
    assert_equal 1, body['frameworks'].size

    # Show
    get "/api/v1/strategy/frameworks/#{fw_id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body['framework']['content'].include?('Régénération')

    # Update to active
    patch "/api/v1/strategy/frameworks/#{fw_id}", params: {
      status: 'active',
      version: 1
    }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'active', body['framework']['status']

    # Delete
    delete "/api/v1/strategy/frameworks/#{fw_id}", as: :json
    assert_response :no_content
  end

  # ─── Axes & Key Results ───

  test 'axes and key results CRUD' do
    # Create axis
    post '/api/v1/strategy/axes', params: {
      title: 'Établir 10 Labs en Europe',
      description: 'Expansion du réseau sur 10 territoires européens',
      target_year: 2030,
      status: 'active',
      color: '#2563EB'
    }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    axis_id = body['axis']['id']
    assert_equal 'Établir 10 Labs en Europe', body['axis']['title']
    assert_equal 2030, body['axis']['targetYear']
    assert_equal 0, body['axis']['progress']

    # List
    get '/api/v1/strategy/axes', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['axes'].size
    assert_equal 0, body['axes'][0]['keyResults'].size

    # Add key results
    post "/api/v1/strategy/axes/#{axis_id}/key-results", params: {
      title: 'Nombre de Labs actifs',
      metric_type: 'number',
      target_value: 10,
      current_value: 4
    }, as: :json
    assert_response :created
    kr_id = JSON.parse(response.body)['keyResult']['id']

    post "/api/v1/strategy/axes/#{axis_id}/key-results", params: {
      title: 'Taux de survie des Labs après 2 ans',
      metric_type: 'percentage',
      target_value: 80,
      current_value: 75
    }, as: :json
    assert_response :created

    # Show axis with key results
    get "/api/v1/strategy/axes/#{axis_id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body['axis']['keyResults'].size
    kr = body['axis']['keyResults'].find { |k| k['id'] == kr_id }
    assert_equal 10.0, kr['targetValue']
    assert_equal 4.0, kr['currentValue']

    # Update key result value
    patch "/api/v1/strategy/key-results/#{kr_id}", params: {
      current_value: 5,
      status: 'on_track'
    }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 5.0, body['keyResult']['currentValue']

    # Update axis progress
    patch "/api/v1/strategy/axes/#{axis_id}", params: { progress: 40 }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 40, body['axis']['progress']

    # Delete key result
    delete "/api/v1/strategy/key-results/#{kr_id}", as: :json
    assert_response :no_content

    get "/api/v1/strategy/axes/#{axis_id}", as: :json
    body = JSON.parse(response.body)
    assert_equal 1, body['axis']['keyResults'].size

    # Delete axis (cascades to remaining key results)
    delete "/api/v1/strategy/axes/#{axis_id}", as: :json
    assert_response :no_content

    get '/api/v1/strategy/axes', as: :json
    body = JSON.parse(response.body)
    assert_equal 0, body['axes'].size
  end
end
