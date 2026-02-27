require 'test_helper'

class StrategyTest < ActionDispatch::IntegrationTest
  setup do
    [
      Strategy::KeyResult,
      Strategy::Axis,
      Strategy::Framework,
      Strategy::DeliberationComment,
      Strategy::Reaction,
      Strategy::Proposal,
      Strategy::Deliberation,
      Strategy::Resource
    ].each(&:delete_all)
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

  test 'deliberation with proposals reactions and comments' do
    # Create deliberation
    post '/api/v1/strategy/deliberations', params: {
      title: 'Protocole de membrane financière',
      context: '<p>Définir les seuils de décision locale vs réseau.</p>',
      decision_mode: 'consent'
    }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    delib_id = body['deliberation']['id']
    assert_equal 'open', body['deliberation']['status']
    assert_equal 'consent', body['deliberation']['decisionMode']

    # List
    get '/api/v1/strategy/deliberations', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['deliberations'].size

    # Filter by status
    get '/api/v1/strategy/deliberations?status=decided', as: :json
    body = JSON.parse(response.body)
    assert_equal 0, body['deliberations'].size

    # Show
    get "/api/v1/strategy/deliberations/#{delib_id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 0, body['deliberation']['proposals'].size

    # Add proposal
    post "/api/v1/strategy/deliberations/#{delib_id}/proposals", params: {
      content: '<p>Seuil local: 5000€/trimestre. Au-delà: validation réseau.</p>'
    }, as: :json
    assert_response :created
    proposal_id = JSON.parse(response.body)['proposal']['id']

    # Add reaction
    post "/api/v1/strategy/proposals/#{proposal_id}/reactions", params: {
      position: 'consent',
      rationale: 'Le seuil est raisonnable pour les petits Labs.'
    }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 'consent', body['reaction']['position']

    # Update reaction (same member, should update not duplicate)
    post "/api/v1/strategy/proposals/#{proposal_id}/reactions", params: {
      position: 'objection',
      rationale: 'Finalement 5000€ est trop bas pour IDF.'
    }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 'objection', body['reaction']['position']

    # Show deliberation with proposals and reactions
    get "/api/v1/strategy/deliberations/#{delib_id}", as: :json
    body = JSON.parse(response.body)
    assert_equal 1, body['deliberation']['proposals'].size
    assert_equal 1, body['deliberation']['proposals'][0]['reactions'].size
    assert_equal 'objection', body['deliberation']['proposals'][0]['reactions'][0]['position']

    # Add comment
    post "/api/v1/strategy/deliberations/#{delib_id}/comments", params: {
      content: 'Peut-être adapter le seuil par pays ?'
    }, as: :json
    assert_response :created

    # List comments
    get "/api/v1/strategy/deliberations/#{delib_id}/comments", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['comments'].size

    # Decide
    patch "/api/v1/strategy/deliberations/#{delib_id}/decide", params: {
      outcome: '<p>Seuil fixé à 5000€ avec exception pour IDF (7500€).</p>'
    }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'decided', body['deliberation']['status']
    assert body['deliberation']['decidedAt'].present?

    # Update
    patch "/api/v1/strategy/deliberations/#{delib_id}", params: {
      title: 'Protocole de membrane financière (v2)'
    }, as: :json
    assert_response :success

    # Delete comment
    get "/api/v1/strategy/deliberations/#{delib_id}/comments", as: :json
    comment_id = JSON.parse(response.body)['comments'][0]['id']
    delete "/api/v1/strategy/deliberation-comments/#{comment_id}", as: :json
    assert_response :no_content

    # Delete deliberation
    delete "/api/v1/strategy/deliberations/#{delib_id}", as: :json
    assert_response :no_content
  end

  # ─── Frameworks ───

  test 'frameworks CRUD with deliberation link' do
    # Create a decided deliberation first
    post '/api/v1/strategy/deliberations', params: {
      title: 'Charte des valeurs',
      decision_mode: 'consent'
    }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']
    patch "/api/v1/strategy/deliberations/#{delib_id}/decide", params: {
      outcome: 'Valeurs adoptées.'
    }, as: :json

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
