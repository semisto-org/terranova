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
    skip 'Requires mocha (any_instance.stubs); not in Gemfile'
  end

  test 'chat endpoint handles gateway errors gracefully' do
    skip 'Requires mocha (any_instance.stubs); not in Gemfile'
  end

  test 'chat includes member context when logged in' do
    skip 'Requires mocha (any_instance.stubs); not in Gemfile'
  end

  test 'chat parses gateway response with payloads correctly' do
    skip 'Requires mocha (any_instance.stubs); not in Gemfile'
  end

  test 'chat handles malformed gateway response' do
    skip 'Requires mocha (any_instance.stubs); not in Gemfile'
  end

  test 'chat handles gateway error response' do
    skip 'Requires mocha (any_instance.stubs); not in Gemfile'
  end
end
