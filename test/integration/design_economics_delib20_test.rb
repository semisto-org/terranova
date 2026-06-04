require 'test_helper'

# Délibération #20 — cadre économique du bureau d'études.
# Couvre : taux designer par projet, formats + rétrocession, contribution Semisto
# sur les offres et les recettes, bucket net de rétrocession, volumes d'activité
# rémunéré/non-rémunéré, et clôture de projet avec retour d'expérience.
class DesignEconomicsDelib20Test < ActionDispatch::IntegrationTest
  setup do
    [Design::QuoteLine, Design::Quote, Design::ProjectTimesheet, BucketTransaction,
     Revenue, Design::Project].each(&:delete_all)

    @org = Organization.first || Organization.create!(name: 'Semisto', slug: 'semisto')
    @member = Member.create!(first_name: 'Eric', last_name: 'Luyckx',
                             email: "eric-#{SecureRandom.hex(4)}@example.test",
                             avatar: '', status: 'active', is_admin: true, joined_at: Date.current)

    @project = Design::Project.create!(
      name: 'Verger collectif', client_id: 'client-1', client_name: 'Commune X',
      client_email: 'commune@example.test', phase: 'offre', status: 'active',
      city: 'Yvoir', area: 2000, project_manager_id: @member.id,
      hours_billed: 100, format_code: 'a', designer_rate: 50
    )
  end

  test 'project serializer exposes format, designer rate and effective retrocession' do
    get "/api/v1/design/#{@project.id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)['project']

    assert_equal 'a', body['formatCode']
    assert_equal 50.0, body['designerRate']
    assert_equal 50.0, body['effectiveDesignerRate']
    assert_equal 0.15, body['effectiveRetrocessionRate'] # format a => 15 %
    assert_includes body['formatLabel'], 'standard'
  end

  test 'creating a project with format c yields 5 percent retrocession default' do
    post '/api/v1/design', params: {
      name: 'Collab Woluwé', client_name: 'Privé', client_email: 'p@example.test',
      phase: 'offre', status: 'active', format_code: 'c', designer_rate: 60
    }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 'c', body['formatCode']
    assert_equal 0.05, body['effectiveRetrocessionRate']
  end

  test 'designer rate outside 40-60 is rejected' do
    patch "/api/v1/design/#{@project.id}", params: { designer_rate: 75 }, as: :json
    assert_response :unprocessable_entity
  end

  test 'quote computes Semisto contribution line at the project retrocession rate' do
    post "/api/v1/design/#{@project.id}/quotes", params: { title: 'Devis', vat_rate: 21 }, as: :json
    assert_response :created
    quote_id = JSON.parse(response.body)['id']

    post "/api/v1/design/quotes/#{quote_id}/lines",
         params: { description: 'Design jardin-forêt', quantity: 100, unit: 'h', unit_price: 50 }, as: :json
    assert_response :created

    body = JSON.parse(response.body)
    # serialize_quote_line is returned here; refetch the quote via show
    get "/api/v1/design/#{@project.id}", as: :json
    quote = JSON.parse(response.body)['quotes'].first

    assert_equal 5000.0, quote['subtotal']
    assert_equal 0.15, quote['contributionRate']
    assert_equal 750.0, quote['contributionAmount']               # 5000 * 0.15
    assert_equal 'Contribution au fonctionnement de Semisto ASBL', quote['contributionLabel']
    # total = (5000 + 750) * 1.21
    assert_in_delta 6957.5, quote['total'], 0.01
  end

  test 'billing overview exposes per-project rates and bucket net of retrocession' do
    BucketTransaction.create!(projectable: @project, kind: 'credit', amount: 6000,
                              date: Date.current, description: 'Acompte',
                              recorded_by_id: @member.id, recorded_by_name: 'Eric')

    get '/api/v1/design/billing-overview', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    row = body['projects'].find { |p| p['projectId'] == @project.id.to_s }

    assert_equal 50.0, row['designerRate']
    assert_equal 0.15, row['retrocessionRate']
    assert_equal 5000.0, row['theoreticalRevenue']               # 100h * 50
    assert_equal 750.0, row['theoreticalContribution']           # 5000 * 0.15
    assert_equal 5250.0, row['bucketNetBudget']                  # 6000 - 0 - 750
    assert body['totals'].key?('bucketNetBudget')
  end

  test 'activity volumes split paid vs unpaid hours per member' do
    Design::ProjectTimesheet.create!(project: @project, member_id: @member.id.to_s, member_name: 'Eric',
                                     date: Date.current, hours: 8, phase: 'offre', mode: 'billed')
    Design::ProjectTimesheet.create!(project: @project, member_id: @member.id.to_s, member_name: 'Eric',
                                     date: Date.current, hours: 2, phase: 'offre', mode: 'semos')

    get '/api/v1/design/activity-volumes', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    row = body['members'].find { |m| m['memberId'] == @member.id.to_s }

    assert_equal 8.0, row['paidHours']
    assert_equal 2.0, row['unpaidHours']
    assert_equal 10.0, row['totalHours']
    assert_equal 0.8, row['paidShare']
    assert_equal 8.0, body['totals']['paidHours']
  end

  test 'closing a project stamps closed_at and records feedback' do
    patch "/api/v1/design/#{@project.id}", params: {
      status: 'completed', closure_feedback: 'Bon déroulé, client satisfait.'
    }, as: :json
    assert_response :success
    body = JSON.parse(response.body)

    assert_equal 'completed', body['status']
    assert_not_nil body['closedAt']
    assert_equal 'Bon déroulé, client satisfait.', body['closureFeedback']
  end

  test 'revenue carries a Semisto contribution amount' do
    post "/api/v1/projects/design-project/#{@project.id}/revenues", params: {
      amount: 5750, amount_excl_vat: 5750, date: Date.current.iso8601,
      pole: 'design_studio', label: 'Facture projet', status: 'confirmed',
      contribution_semisto_amount: 750
    }, as: :json
    assert_response :created
    body = JSON.parse(response.body)

    assert_equal 750.0, body['contributionSemistoAmount']
    assert_equal 'Contribution au fonctionnement de Semisto ASBL', body['contributionLabel']
  end
end
