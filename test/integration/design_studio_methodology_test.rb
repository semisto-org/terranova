require 'test_helper'

class DesignStudioMethodologyTest < ActionDispatch::IntegrationTest
  setup do
    [Design::MethodologyItem, Design::Project].each(&:delete_all)

    @project = Design::Project.create!(
      name: 'Projet methodo test',
      client_id: 'client-1',
      client_name: 'Client Test',
      client_email: 'client@test.com',
      city: 'Yvoir',
      area: 1000,
      phase: 'offre',
      status: 'pending',
      project_manager_id: 'member-1'
    )
  end

  test 'GET methodology returns the 6-step tree, toolbox and references' do
    get "/api/v1/design/#{@project.id}/methodology", as: :json
    assert_response :success

    body = response.parsed_body
    assert_equal 6, body['steps'].length
    assert_equal 'observation', body['steps'].first['key']
    assert body['steps'].first['subSections'].present?
    assert body['toolbox']['fleur_permaculturelle'].present?
    assert_equal 9, body['toolbox']['principes_mollison'].length
    assert_equal 12, body['toolbox']['principes_holmgren'].length
    assert body['references']['sites'].present?
    assert body['summary']['observation'].present?
    assert_equal 0, body['summary']['observation']['done']
  end

  test 'PATCH methodology item upserts status and GET reflects it' do
    patch "/api/v1/design/#{@project.id}/methodology/item",
          params: { node_key: 'observation/releve/analyse-de-sol', status: 'done', notes: 'sol argileux' },
          as: :json
    assert_response :success
    assert_equal 'done', response.parsed_body['status']

    get "/api/v1/design/#{@project.id}/methodology", as: :json
    body = response.parsed_body
    assert_equal 'done', body['items']['observation/releve/analyse-de-sol']['status']
    assert_equal 'sol argileux', body['items']['observation/releve/analyse-de-sol']['notes']
    assert_operator body['summary']['observation']['done'], :>=, 1
  end

  test 'PATCH methodology item upsert is idempotent on the same node_key' do
    2.times do
      patch "/api/v1/design/#{@project.id}/methodology/item",
            params: { node_key: 'design/selection-palette/diversification', status: 'in_progress' },
            as: :json
      assert_response :success
    end
    assert_equal 1, @project.methodology_items.where(node_key: 'design/selection-palette/diversification').count
  end

  test 'PATCH with an unknown node_key is rejected' do
    patch "/api/v1/design/#{@project.id}/methodology/item",
          params: { node_key: 'foo/bar', status: 'done' },
          as: :json
    assert_response :unprocessable_entity
  end

  test 'PATCH with an invalid status is rejected' do
    patch "/api/v1/design/#{@project.id}/methodology/item",
          params: { node_key: 'observation/releve/analyse-de-sol', status: 'wat' },
          as: :json
    assert_response :unprocessable_entity
  end

  # --- Contrat de définition figé (cf. Advisor : geler l'espace des clés) ---

  test 'the methodology key space is frozen' do
    # Tout changement de ces nombres doit être un diff délibéré + bump de VERSION.
    assert_equal 106, Design::Methodology.flat_node_keys.size, 'flat_node_keys (étapes+sous-sections+items)'
    assert_equal 72, Design::Methodology.countable_node_keys.size, 'feuilles comptables'
    assert_equal 6, Design::Methodology.tree.size
    # Les 3 niveaux de clés sont valides ; une clé inventée ne l'est pas.
    assert Design::Methodology.valid_node_key?('observation')
    assert Design::Methodology.valid_node_key?('observation/releve')
    assert Design::Methodology.valid_node_key?('observation/releve/analyse-de-sol')
    assert_not Design::Methodology.valid_node_key?('observation/inexistant')
  end

  test 'progress total counts only leaf items, never containers' do
    # Observation = promenade(3) + entrevue(3) + relevé(4) = 10 feuilles.
    assert_equal 10, @project.methodology_progress['observation'][:total]
    assert_equal 0, @project.methodology_progress['observation'][:done]
    assert_equal 0, @project.methodology_progress['observation'][:percent]
  end

  test 'GET payload exposes the definition version' do
    get "/api/v1/design/#{@project.id}/methodology", as: :json
    assert_equal Design::Methodology::VERSION, response.parsed_body['version']
  end

  # --- Sémantique du PATCH partiel (cf. Advisor) ---

  test 'notes-only PATCH creates a row defaulting to todo' do
    patch "/api/v1/design/#{@project.id}/methodology/item",
          params: { node_key: 'observation/releve/notes', notes: 'terrain pentu' },
          as: :json
    assert_response :success
    item = @project.methodology_items.find_by(node_key: 'observation/releve/notes')
    assert_equal 'todo', item.status
    assert_equal 'terrain pentu', item.notes
  end

  test 'status-only PATCH does not wipe existing notes' do
    patch "/api/v1/design/#{@project.id}/methodology/item",
          params: { node_key: 'observation/releve/notes', notes: 'à conserver' }, as: :json
    patch "/api/v1/design/#{@project.id}/methodology/item",
          params: { node_key: 'observation/releve/notes', status: 'done' }, as: :json
    assert_response :success
    item = @project.methodology_items.find_by(node_key: 'observation/releve/notes')
    assert_equal 'done', item.status
    assert_equal 'à conserver', item.notes
  end
end
