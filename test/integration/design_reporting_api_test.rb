require 'test_helper'

# Reporting du Design Studio — GET /api/v1/design_studio/reporting.
# Verrouille le contrat consommé par ReportingDashboard.tsx : le payload doit
# exposer kpis / timeseries / projects / members / alerts / filter_options.
class DesignReportingApiTest < ActionDispatch::IntegrationTest
  setup do
    [Design::ProjectTimesheet, Expense, Revenue, Design::Project].each(&:delete_all)

    @org = Organization.first || Organization.create!(name: 'Semisto', slug: 'semisto')
    @member = Member.create!(first_name: 'Eric', last_name: 'Luyckx',
                             email: "eric-#{SecureRandom.hex(4)}@example.test",
                             avatar: '', status: 'active', is_admin: true, joined_at: Date.current)

    @project = Design::Project.create!(
      name: 'Verger collectif', client_id: 'client-1', client_name: 'Commune X',
      client_email: 'commune@example.test', phase: 'offre', status: 'active',
      city: 'Yvoir', area: 2000, project_manager_id: @member.id
    )

    Revenue.create!(amount: 5000, amount_excl_vat: 5000, date: Date.current,
                    pole: 'design_studio', status: 'confirmed', category: 'Design',
                    projectable: @project)
    Expense.create!(total_incl_vat: 2000, expense_type: 'services_and_goods', status: 'processing',
                    supplier: 'Pépinière', invoice_date: Date.current, category: 'Achats',
                    poles: ['design'], projectable: @project)
    Design::ProjectTimesheet.create!(project: @project, member_id: @member.id.to_s, member_name: 'Eric',
                                     date: Date.current, hours: 10, phase: 'offre', mode: 'billed')
  end

  test 'reporting payload exposes the keys the dashboard consumes' do
    get '/api/v1/design_studio/reporting', as: :json

    assert_response :success
    body = JSON.parse(response.body)

    %w[kpis timeseries projects members alerts filter_options].each do |key|
      assert body.key?(key), "payload manque la clé #{key}"
    end

    assert_equal 5000.0, body.dig('kpis', 'revenues')
    assert_equal 2000.0, body.dig('kpis', 'expenses')
    assert_equal 3000.0, body.dig('kpis', 'gross_margin')
    assert_equal 10.0, body.dig('kpis', 'total_hours')

    project_row = body['projects'].find { |row| row['key'] == @project.id.to_s }
    assert_not_nil project_row
    assert_equal 5000.0, project_row['revenues']
    assert_equal 'Commune X', project_row['client_name']

    member_row = body['members'].find { |row| row['key'] == @member.id.to_s }
    assert_not_nil member_row
    assert_equal 10.0, member_row['hours']

    assert body['filter_options']['projects'].any? { |opt| opt['id'] == @project.id.to_s }
    assert body['filter_options']['members'].any? { |opt| opt['id'] == @member.id.to_s }
    assert_empty body['alerts'] # marge positive => aucune alerte
  end

  test 'reporting flags a negative-margin project as a high alert' do
    Expense.create!(total_incl_vat: 9000, expense_type: 'services_and_goods', status: 'processing',
                    supplier: 'Sous-traitant', invoice_date: Date.current, category: 'Achats',
                    poles: ['design'], projectable: @project)

    get '/api/v1/design_studio/reporting', as: :json
    assert_response :success
    body = JSON.parse(response.body)

    assert body.dig('kpis', 'gross_margin').negative?
    alert = body['alerts'].find { |a| a['kind'] == 'negative_margin' }
    assert_not_nil alert
    assert_equal 'high', alert['level']
    assert_equal @project.id.to_s, alert['projectId']
  end
end
