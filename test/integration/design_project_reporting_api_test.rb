require 'test_helper'

# Détail financier d'UN projet Design Studio — GET
# /api/v1/design_studio/reporting/projects/:id. Alimente la modale « santé financière »
# (issue #136). Verrouille : en-tête HT (CA / coûts split prestations-refacturés / marge),
# lignes recettes & dépenses (la ventilée porte le montant alloué, pas le total),
# heures billed vs semos, vie-entière (dépense hors période incluse), et cohérence
# des totaux avec la ligne projet de GET /api/v1/design_studio/reporting.
class DesignProjectReportingApiTest < ActionDispatch::IntegrationTest
  setup do
    [ExpenseProjectAllocation, Design::ProjectTimesheet, Expense, Revenue, Design::Project].each(&:delete_all)

    @org = Organization.first || Organization.create!(name: 'Semisto', slug: 'semisto')
    @member = Member.create!(first_name: 'Eric', last_name: 'Luyckx',
                             email: "eric-#{SecureRandom.hex(4)}@example.test",
                             avatar: '', status: 'active', is_admin: false, joined_at: Date.current)

    @project = Design::Project.create!(
      name: 'Verger collectif', client_id: 'client-1', client_name: 'Commune X',
      client_email: 'commune@example.test', phase: 'offre', status: 'active',
      city: 'Yvoir', area: 2000, project_manager_id: @member.id, expenses_budget: 2500
    )

    # Recette HT 5000 (TTC 6050).
    Revenue.create!(amount: 6050, amount_excl_vat: 5000, date: Date.current,
                    pole: 'design_studio', status: 'confirmed', category: 'Design',
                    label: 'Acompte design', projectable: @project)

    # Dépense à lien direct, refacturée au client (HT 800).
    Expense.create!(amount_excl_vat: 800, total_incl_vat: 968, expense_type: 'services_and_goods', status: 'processing',
                    supplier: 'Sous-traitant', invoice_date: Date.current, category: 'Achats', name: 'Plants',
                    poles: ['design'], billable_to_client: true, projectable: @project)

    # Dépense ventilée (aucun projectable direct) : 300 → @project. billable=false (prestation).
    ventilated = Expense.create!(amount_excl_vat: 1000, total_incl_vat: 1210, expense_type: 'other', status: 'processing',
                                 supplier: 'Eric', invoice_date: Date.current, category: 'Prestations', name: 'Honoraires',
                                 poles: ['design'], billable_to_client: false)
    ventilated.project_allocations.create!(projectable: @project, amount: 300)

    # Heures : 10 billed + 4 semos.
    Design::ProjectTimesheet.create!(project: @project, member_id: @member.id.to_s, member_name: 'Eric',
                                     date: Date.current, hours: 10, phase: 'offre', mode: 'billed')
    Design::ProjectTimesheet.create!(project: @project, member_id: @member.id.to_s, member_name: 'Eric',
                                     date: Date.current, hours: 4, phase: 'offre', mode: 'semos')
  end

  test 'project detail header is HT, splits costs, and computes margin' do
    get "/api/v1/design_studio/reporting/projects/#{@project.id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)

    header = body['header']
    assert_equal @project.id.to_s, header['project_id']
    assert_equal 'Verger collectif', header['name']
    assert_equal 'active', header['status']
    assert_equal 'Commune X', header['client_name']

    # CA HT 5000 ; coûts 800 (direct refacturé) + 300 (alloué prestation) = 1100.
    assert_equal 5000.0, header['revenues']
    assert_equal 1100.0, header['expenses']
    assert_equal 800.0, header['rebilled_expenses']
    assert_equal 300.0, header['non_rebilled_expenses']
    assert_equal 3900.0, header['gross_margin']
    assert_equal 14.0, header['total_hours']
    assert_equal 10.0, header['billed_hours']
    assert_equal 4.0, header['semos_hours']
    assert_equal false, header['negative_margin']
  end

  test 'project detail lists revenue and expense lines, allocation shows allocated amount' do
    get "/api/v1/design_studio/reporting/projects/#{@project.id}", as: :json
    body = JSON.parse(response.body)

    assert_equal 1, body['revenues'].length
    revenue = body['revenues'].first
    assert_equal 'Acompte design', revenue['label']
    assert_equal 5000.0, revenue['amount_excl_vat']
    assert_equal 'confirmed', revenue['status']

    direct = body['expenses'].find { |e| e['source'] == 'direct' }
    assert_not_nil direct
    assert_equal 800.0, direct['amount_excl_vat']
    assert_equal true, direct['billable_to_client']
    assert_equal 'Sous-traitant', direct['supplier']

    allocation = body['expenses'].find { |e| e['source'] == 'allocation' }
    assert_not_nil allocation
    # La ventilée porte le montant ALLOUÉ (300), pas le total (1000).
    assert_equal 300.0, allocation['amount_excl_vat']
    assert_equal 1000.0, allocation['full_amount_excl_vat']
    assert_equal false, allocation['billable_to_client']
  end

  test 'project detail breaks hours into billed and semos with by-member split' do
    get "/api/v1/design_studio/reporting/projects/#{@project.id}", as: :json
    body = JSON.parse(response.body)

    assert_equal 10.0, body.dig('hours', 'billed')
    assert_equal 4.0, body.dig('hours', 'semos')
    assert_equal 14.0, body.dig('hours', 'total')

    member = body.dig('hours', 'by_member').find { |m| m['member_id'] == @member.id.to_s }
    assert_not_nil member
    assert_equal 10.0, member['billed']
    assert_equal 4.0, member['semos']
    assert_equal 14.0, member['total']
  end

  test 'project detail covers the whole project lifetime, including out-of-period expenses' do
    # Dépense très ancienne sur @project, refacturée (HT 500).
    Expense.create!(amount_excl_vat: 500, total_incl_vat: 605, expense_type: 'other', status: 'processing',
                    supplier: 'Antoine', invoice_date: Date.current - 400, category: 'Prestations', name: 'Vieille facture',
                    poles: ['design'], billable_to_client: true, projectable: @project)

    get "/api/v1/design_studio/reporting/projects/#{@project.id}", as: :json
    body = JSON.parse(response.body)

    # Coûts vie-entière : 800 + 300 + 500 = 1600 (l'ancienne dépense compte).
    assert_equal 1600.0, body.dig('header', 'expenses')
    assert_equal 1300.0, body.dig('header', 'rebilled_expenses')
    assert(body['expenses'].any? { |e| e['label'] == 'Vieille facture' })
  end

  test 'detail totals equal the reporting project row (consistency)' do
    get "/api/v1/design_studio/reporting/projects/#{@project.id}", as: :json
    detail = JSON.parse(response.body)['header']

    get '/api/v1/design_studio/reporting', as: :json
    row = JSON.parse(response.body)['projects'].find { |r| r['key'] == @project.id.to_s }

    assert_not_nil row
    assert_equal row['revenues'], detail['revenues']
    assert_equal row['expenses'], detail['expenses']
    assert_equal row['rebilled_expenses'], detail['rebilled_expenses']
    assert_equal row['non_rebilled_expenses'], detail['non_rebilled_expenses']
    assert_equal row['gross_margin'], detail['gross_margin']
    assert_equal row['hours'], detail['total_hours']
  end

  test 'project detail flags negative margin and budget overrun' do
    # Grosse dépense directe non refacturée pour rendre la marge négative et dépasser le budget (2500).
    Expense.create!(amount_excl_vat: 6000, total_incl_vat: 7260, expense_type: 'services_and_goods', status: 'processing',
                    supplier: 'Gros sous-traitant', invoice_date: Date.current, category: 'Achats', name: 'Gros poste',
                    poles: ['design'], billable_to_client: false, projectable: @project)

    get "/api/v1/design_studio/reporting/projects/#{@project.id}", as: :json
    header = JSON.parse(response.body)['header']

    assert header['gross_margin'].negative?
    assert_equal true, header['negative_margin']
    assert_equal true, header['over_budget']
  end
end
