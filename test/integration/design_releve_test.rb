require 'test_helper'

class DesignReleveTest < ActionDispatch::IntegrationTest
  setup do
    [Design::SoilSample, Design::Project].each(&:delete_all)

    @project = Design::Project.create!(
      name: 'Projet relevé test',
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

  test 'GET releve returns soil samples and plan url' do
    @project.soil_samples.create!(location_label: 'Zone nord', depth_cm: 30, pollutant_flag: true)
    get "/api/v1/design/#{@project.id}/releve", as: :json
    assert_response :success
    body = response.parsed_body
    assert_equal 1, body['soilSamples'].length
    assert_equal true, body['soilSamples'].first['pollutantFlag']
    assert body.key?('planUrl')
  end

  test 'create a soil sample' do
    post "/api/v1/design/#{@project.id}/soil-samples",
         params: { location_label: 'Verger', depth_cm: 40, pollutant_flag: false }, as: :json
    assert_response :created
    assert_equal 'Verger', response.parsed_body['locationLabel']
  end

  test 'soil sample requires a location label' do
    post "/api/v1/design/#{@project.id}/soil-samples", params: { depth_cm: 10 }, as: :json
    assert_response :unprocessable_entity
  end

  test 'update lab status and delete' do
    sample = @project.soil_samples.create!(location_label: 'Zone sud')
    patch "/api/v1/design/soil-samples/#{sample.id}", params: { lab_status: 'sent' }, as: :json
    assert_response :success
    assert_equal 'sent', response.parsed_body['labStatus']

    delete "/api/v1/design/soil-samples/#{sample.id}", as: :json
    assert_response :no_content
    assert_equal 0, @project.soil_samples.count
  end

  test 'invalid lab status rejected' do
    sample = @project.soil_samples.create!(location_label: 'X')
    patch "/api/v1/design/soil-samples/#{sample.id}", params: { lab_status: 'wat' }, as: :json
    assert_response :unprocessable_entity
  end
end
