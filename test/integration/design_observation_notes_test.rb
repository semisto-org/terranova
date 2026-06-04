require 'test_helper'

class DesignObservationNotesTest < ActionDispatch::IntegrationTest
  setup do
    [Design::ObservationNote, Design::Project].each(&:delete_all)

    @project = Design::Project.create!(
      name: 'Projet carnet test',
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

  test 'create then list observation notes' do
    post "/api/v1/design/#{@project.id}/observation-notes",
         params: { body: 'Terrain en pente douce, vieux poirier au nord', latitude: 50.31, longitude: 4.88 },
         as: :json
    assert_response :created
    assert_equal 'Terrain en pente douce, vieux poirier au nord', response.parsed_body['body']

    get "/api/v1/design/#{@project.id}/observation-notes", as: :json
    assert_response :success
    assert_equal 1, response.parsed_body.length
    assert_equal '50.31', response.parsed_body.first['latitude'].to_s
  end

  test 'captured_at is stamped automatically' do
    post "/api/v1/design/#{@project.id}/observation-notes", params: { body: 'Note' }, as: :json
    assert_response :created
    assert response.parsed_body['capturedAt'].present?
  end

  test 'a note with neither body nor media is rejected' do
    post "/api/v1/design/#{@project.id}/observation-notes", params: { body: '' }, as: :json
    assert_response :unprocessable_entity
  end

  test 'destroy an observation note' do
    note = @project.observation_notes.create!(body: 'à supprimer')
    delete "/api/v1/design/observation-notes/#{note.id}", as: :json
    assert_response :no_content
    assert_equal 0, @project.observation_notes.count
  end
end
