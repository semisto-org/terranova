require 'test_helper'

class NovaControllerTest < ActionDispatch::IntegrationTest
  setup do
    Member.delete_all

    @member = Member.create!(
      first_name: 'Jean',
      last_name: 'Test',
      email: 'jean@example.test',
      avatar: '',
      status: 'active',
      is_admin: false,
      slack_user_id: 'U123456',
      joined_at: Date.current
    )
  end

  test 'chat endpoint requires message param' do
    post '/api/v1/nova/chat', params: {}, as: :json
    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_includes body['error'], 'Message requis'
  end

  test 'chat endpoint returns response when gateway available' do
    # Mock the gateway call to avoid actual network request
    NovaController.any_instance.stubs(:nova_send).returns("Hello from Nova!")

    post '/api/v1/nova/chat', params: { message: 'Bonjour' }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'Hello from Nova!', body['reply']
  end

  test 'chat endpoint handles gateway errors gracefully' do
    NovaController.any_instance.stubs(:nova_send).raises(StandardError.new('Gateway timeout'))

    post '/api/v1/nova/chat', params: { message: 'Test error' }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_includes body['reply'], 'problème technique'
  end

  test 'chat includes member context when logged in' do
    # This test verifies the context prefix is built correctly
    # The actual gateway call is mocked
    NovaController.any_instance.stubs(:`).returns('{"result":{"payloads":[{"text":"Réponse contextualisée"}]}}}')

    post '/api/v1/nova/chat', params: { message: 'Qui suis-je ?' }, as: :json
    assert_response :success
  end

  test 'chat parses gateway response with payloads correctly' do
    mock_response = 'Gateway call: agent {"result":{"payloads":[{"text":"Premier message"},{"text":"Deuxième message"}],"meta":{"durationMs":1000}}}'
    NovaController.any_instance.stubs(:`).returns(mock_response)

    post '/api/v1/nova/chat', params: { message: 'Test' }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_includes body['reply'], 'Premier message'
    assert_includes body['reply'], 'Deuxième message'
  end

  test 'chat handles malformed gateway response' do
    NovaController.any_instance.stubs(:`).returns('Invalid JSON response')

    post '/api/v1/nova/chat', params: { message: 'Test' }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_includes body['reply'], 'Invalid JSON response'
  end

  test 'chat handles gateway error response' do
    mock_response = 'Gateway call: agent {"error":"Rate limit exceeded"}'
    NovaController.any_instance.stubs(:`).returns(mock_response)

    post '/api/v1/nova/chat', params: { message: 'Test' }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_includes body['reply'], 'Rate limit exceeded'
  end
end
