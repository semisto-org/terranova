require 'test_helper'

class LabReportingApiTest < ActionDispatch::IntegrationTest
  setup do
    [MemberRole, Member, Expense, Revenue].each(&:delete_all)

    member = Member.create!(first_name: 'Admin', last_name: 'Lab', email: 'admin-lab@example.test', avatar: '', status: 'active', is_admin: true, joined_at: Date.current)
    member.member_roles.create!(role: 'admin')

    Revenue.create!(amount: 1000, date: Date.new(2026, 1, 10), pole: 'academy', status: 'confirmed', category: 'Formations')
    Expense.create!(total_incl_vat: 700, expense_type: 'services_and_goods', status: 'processing', supplier: 'Alpha', invoice_date: Date.new(2026, 1, 11), category: 'Prestations', poles: ['academy'])
  end

  test 'returns reporting payload with kpis and series' do
    get '/api/v1/lab/reporting', params: { from: '2026-01-01', to: '2026-01-31', pole: 'academy' }, as: :json

    assert_response :success
    body = JSON.parse(response.body)

    assert body.key?('kpis')
    assert body.key?('timeseries')
    assert body.key?('breakdowns')
    assert_equal 1000.0, body.dig('kpis', 'revenues')
    assert_equal 700.0, body.dig('kpis', 'expenses')
    assert_equal 1, body['timeseries'].size
  end
end
