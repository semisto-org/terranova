require 'test_helper'

# Projets internes Design Studio (#159) : coquille purement design, ZÉRO finance
# (au niveau modèle ET API), hors reporting, créée sans contact client.
class DesignInternalProjectsTest < ActionDispatch::IntegrationTest
  setup do
    [Revenue, Expense, ExpenseProjectAllocation, Design::ProjectClient, Design::Project].each(&:delete_all)
    @org = Organization.first || Organization.create!(name: 'Semisto')
    @member = Member.create!(
      first_name: 'Ada', last_name: 'H', email: "ada-#{SecureRandom.hex(4)}@test.be",
      status: 'active', joined_at: Time.current, member_kind: 'human',
      membership_type: 'effective', is_admin: true
    )
    Thread.current[:test_member] = @member
    @internal = make_project(name: 'Les 4 Sources', kind: 'internal')
    @client = make_project(name: 'Client X', kind: 'client')
  end

  teardown { Thread.current[:test_member] = nil }

  test 'kind defaults to client and internal can be set' do
    assert_equal 'client', @client.kind
    assert @internal.internal?
  end

  test 'finance records are refused on an internal project at model level' do
    # Enregistrements par ailleurs valides → seul le garde-fou interne les bloque.
    revenue = Revenue.new(projectable: @internal, organization: @org, amount: 10, date: Date.current, status: 'confirmed')
    assert_not revenue.valid?
    assert revenue.errors[:projectable].any?

    expense = Expense.new(projectable: @internal, organization: @org, expense_type: 'other',
                          invoice_date: Date.current, supplier: 'Fournisseur')
    assert_not expense.valid?
    assert expense.errors[:projectable].any?

    parent = Expense.create!(projectable: @client, organization: @org, expense_type: 'other',
                             invoice_date: Date.current, supplier: 'Fournisseur')
    allocation = ExpenseProjectAllocation.new(expense: parent, projectable: @internal, amount: 5)
    assert_not allocation.valid?
    assert allocation.errors[:projectable].any?

    # Sur un projet client, la finance reste valide.
    assert Revenue.new(projectable: @client, organization: @org, amount: 10, date: Date.current, status: 'confirmed').valid?
  end

  test 'posting an expense on an internal project via the API returns 422' do
    assert_no_difference -> { Expense.count } do
      post "/api/v1/design/#{@internal.id}/expenses", params: { amount_excl_vat: 100, total_incl_vat: 121 }, as: :json
    end
    assert_response :unprocessable_entity
  end

  test 'reporting never aggregates internal projects' do
    Revenue.create!(projectable: @client, organization: @org, amount: 500, amount_excl_vat: 500,
                    date: Date.current, status: 'confirmed', pole: 'design_studio')
    get '/api/v1/design/reporting', as: :json
    assert_response :success

    labels = JSON.parse(response.body)['projects'].map { |p| p['label'] }
    assert_includes labels, 'Client X'
    assert_not_includes labels, 'Les 4 Sources'
  end

  test 'project reporting for an internal project returns an error' do
    get "/api/v1/design_studio/reporting/projects/#{@internal.id}", as: :json
    assert_response :unprocessable_entity
  end

  test 'creating a project with the internal flag sets kind and creates no client contact' do
    assert_no_difference -> { Design::ProjectClient.count } do
      post '/api/v1/design', params: { name: 'Jardin interne', kind: 'internal' }, as: :json
    end
    assert_response :created

    created = Design::Project.find_by(name: 'Jardin interne')
    assert created.internal?
    assert created.client_name.present?, 'client_name NOT NULL doit être rempli (nom du projet)'
  end

  private

  def make_project(name:, kind:)
    Design::Project.create!(
      name: name, kind: kind, client_id: "c-#{SecureRandom.hex(3)}",
      client_name: name, phase: 'offre', status: 'active', project_manager_id: ''
    )
  end
end
