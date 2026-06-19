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

    Revenue.create!(amount: 6050, amount_excl_vat: 5000, date: Date.current,
                    pole: 'design_studio', status: 'confirmed', category: 'Design',
                    projectable: @project)
    # TVA 21 % : HT 2000 / TTC 2420 — le reporting doit retenir le HT.
    Expense.create!(amount_excl_vat: 2000, total_incl_vat: 2420, expense_type: 'services_and_goods', status: 'processing',
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

    # HTVA : CA 5000 (et non TTC 6050), dépenses 2000 (et non TTC 2420).
    assert_equal 5000.0, body.dig('kpis', 'revenues')
    assert_equal 2000.0, body.dig('kpis', 'expenses')
    assert_equal 3000.0, body.dig('kpis', 'gross_margin')
    assert_equal 10.0, body.dig('kpis', 'total_hours')

    project_row = body['projects'].find { |row| row['key'] == @project.id.to_s }
    assert_not_nil project_row
    assert_equal 5000.0, project_row['revenues']
    assert_equal 2000.0, project_row['expenses']
    assert_equal 'active', project_row['status']
    assert_equal 'Commune X', project_row['client_name']

    member_row = body['members'].find { |row| row['key'] == @member.id.to_s }
    assert_not_nil member_row
    assert_equal 10.0, member_row['hours']

    assert body['filter_options']['projects'].any? { |opt| opt['id'] == @project.id.to_s }
    assert body['filter_options']['members'].any? { |opt| opt['id'] == @member.id.to_s }
    assert_empty body['alerts'] # marge positive => aucune alerte
  end

  test 'project cost includes ventilated expenses and splits rebilled vs prestations' do
    other = Design::Project.create!(
      name: 'Autre verger', client_id: 'client-2', client_name: 'Commune Y',
      client_email: 'y@example.test', phase: 'offre', status: 'active',
      city: 'Dinant', area: 1000, project_manager_id: @member.id
    )

    # Dépense ventilée (aucun projectable direct) : 300 vers @project, 200 vers `other`,
    # reliquat 500 non ventilé (non imputé). billable_to_client=false => prestations.
    # Les montants de ventilation sont saisis en HTVA (amount).
    ventilated = Expense.create!(amount_excl_vat: 1000, total_incl_vat: 1210, expense_type: 'other', status: 'processing',
                                 supplier: 'Eric', invoice_date: Date.current, category: 'Prestations',
                                 poles: ['design'], billable_to_client: false)
    ventilated.project_allocations.create!(projectable: @project, amount: 300)
    ventilated.project_allocations.create!(projectable: other, amount: 200)

    # Dépense à lien direct, refacturée au client (HT 800).
    Expense.create!(amount_excl_vat: 800, total_incl_vat: 968, expense_type: 'services_and_goods', status: 'processing',
                    supplier: 'Sous-traitant', invoice_date: Date.current, category: 'Achats',
                    poles: ['design'], billable_to_client: true, projectable: @project)

    get '/api/v1/design_studio/reporting', as: :json
    assert_response :success
    body = JSON.parse(response.body)

    row = body['projects'].find { |r| r['key'] == @project.id.to_s }
    assert_not_nil row
    # 2000 (direct existant, non refacturé) + 300 (allocation) + 800 (direct refacturé) = 3100
    assert_equal 3100.0, row['expenses']
    assert_equal 800.0, row['rebilled_expenses']
    assert_equal 2300.0, row['non_rebilled_expenses']

    other_row = body['projects'].find { |r| r['key'] == other.id.to_s }
    assert_not_nil other_row, "le projet ne recevant qu'une allocation doit apparaître"
    assert_equal 200.0, other_row['expenses']
    assert_equal 200.0, other_row['non_rebilled_expenses']
    assert_equal 0.0, other_row['rebilled_expenses']
  end

  test 'project rentability uses project lifetime, ignoring the period filter' do
    # Dépense ancienne (hors fenêtre de période) sur @project.
    Expense.create!(amount_excl_vat: 1500, total_incl_vat: 1815, expense_type: 'other', status: 'processing',
                    supplier: 'Antoine', invoice_date: Date.current - 400, category: 'Prestations',
                    poles: ['design'], billable_to_client: false, projectable: @project)

    # Période = 90 derniers jours → l'ancienne dépense est hors période.
    get '/api/v1/design_studio/reporting', params: { period: '90d' }, as: :json
    assert_response :success
    body = JSON.parse(response.body)

    # KPI (filtré période) : n'inclut PAS l'ancienne dépense → 2000 (la dépense récente du setup).
    assert_equal 2000.0, body.dig('kpis', 'expenses')

    # Tableau projet (vie entière) : inclut l'ancienne dépense → 2000 + 1500 = 3500.
    row = body['projects'].find { |r| r['key'] == @project.id.to_s }
    assert_not_nil row
    assert_equal 3500.0, row['expenses']
    assert_equal 3500.0, row['non_rebilled_expenses']
  end

  test 'reporting flags a negative-margin project as a high alert' do
    Expense.create!(amount_excl_vat: 9000, total_incl_vat: 10890, expense_type: 'services_and_goods', status: 'processing',
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
