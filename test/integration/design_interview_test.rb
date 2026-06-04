require 'test_helper'

class DesignInterviewTest < ActionDispatch::IntegrationTest
  setup do
    [Design::Interview, Design::Project].each(&:delete_all)

    @project = Design::Project.create!(
      name: 'Projet entrevue test',
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

  test 'GET interview returns the question set and empty responses' do
    get "/api/v1/design/#{@project.id}/interview", as: :json
    assert_response :success
    body = response.parsed_body
    assert_equal Design::Interview::QUESTIONS.length, body['questions'].length
    assert_equal 'objectifs', body['questions'].first['key']
    assert_equal({}, body['responses'])
  end

  test 'PATCH interview upserts responses and notes, GET reflects them' do
    patch "/api/v1/design/#{@project.id}/interview",
          params: { responses: { objectifs: 'Autonomie alimentaire', vision: 'Forêt nourricière' }, notes: 'porteur très motivé' },
          as: :json
    assert_response :success

    get "/api/v1/design/#{@project.id}/interview", as: :json
    body = response.parsed_body
    assert_equal 'Autonomie alimentaire', body['responses']['objectifs']
    assert_equal 'porteur très motivé', body['notes']
  end

  test 'unknown response keys are ignored (filtered by the question set)' do
    patch "/api/v1/design/#{@project.id}/interview",
          params: { responses: { not_a_question: 'x', objectifs: 'ok' } }, as: :json
    assert_response :success
    get "/api/v1/design/#{@project.id}/interview", as: :json
    body = response.parsed_body
    assert_equal 'ok', body['responses']['objectifs']
    assert_not body['responses'].key?('not_a_question')
  end
end
