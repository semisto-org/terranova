require 'test_helper'

class LabManagementFlowsTest < ActionDispatch::IntegrationTest
  setup do
    [
      BetTeamMembership,
      Bet,
      ScopeTask,
      Scope,
      HillChartSnapshot,
      ChowderItem,
      IdeaItem,
      IdeaList,
      SemosTransaction,
      SemosEmission,
      SemosRate,
      Expense,
      Timesheet,
      EventAttendee,
      Event,
      Pitch,
      Cycle,
      GuildMembership,
      Guild,
      Wallet,
      MemberRole,
      Member
    ].each(&:delete_all)

    @member_a = Member.create!(
      first_name: 'Alice',
      last_name: 'Admin',
      email: 'alice@example.test',
      avatar: '',
      status: 'active',
      is_admin: true,
      joined_at: Date.current
    )
    @member_a.member_roles.create!(role: 'shaper')

    @member_b = Member.create!(
      first_name: 'Bob',
      last_name: 'Builder',
      email: 'bob@example.test',
      avatar: '',
      status: 'active',
      is_admin: false,
      joined_at: Date.current
    )
    @member_b.member_roles.create!(role: 'designer')

    @wallet_a = Wallet.create!(member: @member_a, balance: 120, floor: -50, ceiling: 1000)
    @wallet_b = Wallet.create!(member: @member_b, balance: 10, floor: -50, ceiling: 1000)

    @cycle = Cycle.create!(
      name: 'Cycle test',
      start_date: Date.current - 5,
      end_date: Date.current + 35,
      cooldown_start: Date.current + 36,
      cooldown_end: Date.current + 49,
      status: 'active'
    )

    @shaped_pitch = Pitch.create!(
      title: 'Pitch shaped',
      status: 'shaped',
      appetite: '6-weeks',
      author: @member_a,
      problem: 'Problem',
      solution: 'Solution',
      rabbit_holes: [],
      no_gos: []
    )
  end

  test 'create pitch success and validation failure path' do
    post '/api/v1/lab/pitches', params: {
      title: 'Nouveau pitch',
      status: 'raw',
      appetite: '3-weeks',
      author_id: @member_a.id,
      problem: 'Un problème clair',
      solution: 'Une solution claire',
      rabbit_holes: [],
      no_gos: []
    }, as: :json

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 'Nouveau pitch', body['title']
    assert_equal 'raw', body['status']

    post '/api/v1/lab/pitches', params: {
      title: 'Pitch invalide',
      status: 'raw',
      appetite: '3-weeks',
      author_id: @member_a.id,
      problem: '',
      solution: '',
      rabbit_holes: [],
      no_gos: []
    }, as: :json

    assert_response :unprocessable_entity
  end

  test 'place bet updates pitch status to betting' do
    post '/api/v1/lab/bets', params: {
      pitch_id: @shaped_pitch.id,
      cycle_id: @cycle.id,
      team_member_ids: [@member_a.id, @member_b.id],
      placed_by_id: @member_a.id,
      status: 'pending'
    }, as: :json

    assert_response :created

    @shaped_pitch.reload
    assert_equal 'betting', @shaped_pitch.status

    body = JSON.parse(response.body)
    assert_equal 2, body['teamMemberIds'].size
  end

  test 'transfer semos success and insufficient balance failure' do
    post '/api/v1/lab/semos/transfer', params: {
      from_wallet_id: @wallet_a.id,
      to_wallet_id: @wallet_b.id,
      amount: 50,
      description: 'Test transfer'
    }, as: :json

    assert_response :success
    @wallet_a.reload
    @wallet_b.reload
    assert_equal 70, @wallet_a.balance
    assert_equal 60, @wallet_b.balance

    post '/api/v1/lab/semos/transfer', params: {
      from_wallet_id: @wallet_b.id,
      to_wallet_id: @wallet_a.id,
      amount: 1000,
      description: 'Too much'
    }, as: :json

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_includes body['error'], 'Solde insuffisant'
  end

  test 'create timesheet and reject zero hours' do
    post '/api/v1/lab/timesheets', params: {
      member_id: @member_a.id,
      date: Date.current,
      hours: 2.5,
      payment_type: 'invoice',
      description: 'Contribution',
      category: 'design',
      invoiced: false,
      kilometers: 4
    }, as: :json

    assert_response :created

    patch "/api/v1/lab/timesheets/#{JSON.parse(response.body)['id']}/mark-invoiced", as: :json
    assert_response :success
    assert_equal true, JSON.parse(response.body)['invoiced']

    post '/api/v1/lab/timesheets', params: {
      member_id: @member_a.id,
      date: Date.current,
      hours: 0,
      payment_type: 'invoice',
      description: 'Invalid',
      category: 'design',
      invoiced: false,
      kilometers: 0
    }, as: :json

    assert_response :unprocessable_entity
  end

  test 'overview returns expected top-level payload keys' do
    get '/api/v1/lab/overview', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    %w[
      members cycles guilds pitches bets scopes hillChartSnapshots chowderItems
      ideaLists events wallets semosTransactions semosEmissions semosRates timesheets
    ].each do |key|
      assert body.key?(key), "Missing key #{key}"
    end
  end

  test 'lab expenses list create update delete' do
    get '/api/v1/lab/expenses', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body.key?('items')
    assert_equal 0, body['items'].size

    post '/api/v1/lab/expenses', params: {
      supplier: 'Test Supplier',
      status: 'processing',
      invoice_date: Date.current.iso8601,
      expense_type: 'services_and_goods',
      name: 'Lab expense',
      total_incl_vat: 100,
      amount_excl_vat: 82.64,
      vat_6: 0, vat_12: 0, vat_21: 17.36
    }, as: :json
    assert_response :created
    expense_id = JSON.parse(response.body)['id']

    get '/api/v1/lab/expenses', as: :json
    assert_response :success
    assert_equal 1, JSON.parse(response.body)['items'].size

    patch "/api/v1/lab/expenses/#{expense_id}", params: {
      supplier: 'Test Supplier',
      status: 'paid',
      invoice_date: Date.current.iso8601,
      expense_type: 'services_and_goods',
      name: 'Updated',
      total_incl_vat: 100
    }, as: :json
    assert_response :success
    assert_equal 'paid', JSON.parse(response.body)['status']

    delete "/api/v1/lab/expenses/#{expense_id}", as: :json
    assert_response :no_content

    get '/api/v1/lab/expenses', as: :json
    assert_response :success
    assert_equal 0, JSON.parse(response.body)['items'].size
  end
end
