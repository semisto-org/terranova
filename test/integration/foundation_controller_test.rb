require 'test_helper'

class FoundationControllerTest < ActionDispatch::IntegrationTest
  test 'routes returns milestone and routes list' do
    get '/api/v1/foundation/routes', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert body.key?('milestone')
    assert body.key?('items')
    assert body['items'].is_a?(Array)
    assert body['items'].size > 0
    
    first_route = body['items'].first
    assert first_route.key?('path')
    assert first_route.key?('section')
  end

  test 'shell returns context switcher and sidebar config' do
    get '/api/v1/foundation/shell', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert body.key?('context_switcher')
    assert body.key?('sidebar')
    
    # Context switcher
    assert body['context_switcher'].key?('user')
    assert body['context_switcher'].key?('poles')
    assert body['context_switcher']['poles'].is_a?(Array)
    
    # Sidebar sections
    assert body['sidebar'].key?('design_studio')
    assert body['sidebar'].key?('academy')
    assert body['sidebar'].key?('nursery')
    assert body['sidebar'].key?('implementation')
    assert body['sidebar'].key?('lab_management')
    assert body['sidebar'].key?('website')
  end

  test 'milestone returns current milestone info' do
    get '/api/v1/foundation/milestone', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert body.key?('name')
    assert body.key?('status')
    assert body.key?('sequence_position')
    assert body.key?('next_milestone')
  end
end
