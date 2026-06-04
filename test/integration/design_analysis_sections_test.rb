require 'test_helper'

class DesignAnalysisSectionsTest < ActionDispatch::IntegrationTest
  setup do
    [Design::AnalysisSection, Design::Project].each(&:delete_all)

    @project = Design::Project.create!(
      name: 'Projet analyse test',
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

  test 'PATCH upserts a section then GET returns it keyed by node' do
    patch "/api/v1/design/#{@project.id}/analysis-section",
          params: { node_key: 'analyse-evaluation/ressources-facteurs-limitants',
                    data: { temps: '2 jours/semaine', argent: '5000€' } },
          as: :json
    assert_response :success

    get "/api/v1/design/#{@project.id}/analysis-sections", as: :json
    assert_response :success
    body = response.parsed_body
    assert_equal '2 jours/semaine', body['analyse-evaluation/ressources-facteurs-limitants']['temps']
  end

  test 'upsert is idempotent and merges data' do
    2.times do
      patch "/api/v1/design/#{@project.id}/analysis-section",
            params: { node_key: 'analyse-evaluation/echelle-de-temps', data: { historique: 'ancien verger' } },
            as: :json
    end
    assert_equal 1, @project.analysis_sections.where(node_key: 'analyse-evaluation/echelle-de-temps').count
  end

  test 'unknown node_key is rejected' do
    patch "/api/v1/design/#{@project.id}/analysis-section",
          params: { node_key: 'foo/bar', data: {} }, as: :json
    assert_response :unprocessable_entity
  end
end
