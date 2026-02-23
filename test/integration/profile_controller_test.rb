require 'test_helper'

class ProfileControllerTest < ActionDispatch::IntegrationTest
  setup do
    Member.delete_all
    Wallet.delete_all

    @member = Member.create!(
      first_name: 'Marie',
      last_name: 'Curie',
      email: 'marie@example.test',
      avatar: '',
      status: 'active',
      is_admin: false,
      slack_user_id: 'U987654',
      joined_at: Date.current
    )

    @wallet = Wallet.create!(
      member: @member,
      balance: 150,
      floor: -50,
      ceiling: 1000
    )

    @member.member_roles.create!(role: 'designer')
    @member.member_roles.create!(role: 'formateur')
  end

  test 'show returns current member profile' do
    get '/api/v1/profile', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert_equal @member.id.to_s, body['id']
    assert_equal 'Marie', body['firstName']
    assert_equal 'Curie', body['lastName']
    assert_equal 'marie@example.test', body['email']
    assert_equal 'active', body['status']
    assert_equal false, body['isAdmin']
    assert_equal 'U987654', body['slackUserId']
    assert_equal ['designer', 'formateur'], body['roles']
    assert body.key?('walletId')
    assert body.key?('guildIds')
    assert body.key?('joinedAt')
  end

  test 'show includes wallet information' do
    get '/api/v1/profile', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert_equal @wallet.id.to_s, body['walletId']
  end

  test 'update profile fields' do
    patch '/api/v1/profile', params: {
      first_name: 'Maria',
      last_name: 'Skłodowska',
      slack_user_id: 'U111111'
    }, as: :json

    assert_response :success
    
    body = JSON.parse(response.body)
    assert_equal 'Maria', body['firstName']
    assert_equal 'Skłodowska', body['lastName']
    assert_equal 'U111111', body['slackUserId']
    
    @member.reload
    assert_equal 'Maria', @member.first_name
    assert_equal 'Skłodowska', @member.last_name
  end

  test 'cannot update email via profile' do
    original_email = @member.email
    
    patch '/api/v1/profile', params: {
      email: 'newemail@example.test'
    }, as: :json

    assert_response :success
    
    @member.reload
    assert_equal original_email, @member.email
  end

  test 'cannot update admin status via profile' do
    patch '/api/v1/profile', params: {
      is_admin: true
    }, as: :json

    assert_response :success
    
    @member.reload
    assert_equal false, @member.is_admin
  end

  test 'update validates required fields' do
    patch '/api/v1/profile', params: {
      first_name: '',
      last_name: ''
    }, as: :json

    assert_response :unprocessable_entity
  end

  test 'update avatar_url returns avatar path' do
    # Skip actual ActiveStorage test, just verify endpoint exists
    get '/api/v1/profile/avatar_url', as: :json
    assert_response :success
  end

  test 'wallet returns wallet details' do
    get '/api/v1/profile/wallet', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert_equal @wallet.id.to_s, body['id']
    assert_equal 150, body['balance']
    assert_equal -50, body['floor']
    assert_equal 1000, body['ceiling']
    assert_equal @member.id.to_s, body['memberId']
  end

  test 'transactions returns wallet transactions' do
    get '/api/v1/profile/transactions', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert body.key?('transactions')
    assert body.key?('emissions')
  end

  test 'activities returns member activity log' do
    get '/api/v1/profile/activities', as: :json
    assert_response :success
    
    body = JSON.parse(response.body)
    assert body.key?('activities')
  end
end
