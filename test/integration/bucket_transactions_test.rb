require "test_helper"

class BucketTransactionsTest < ActionDispatch::IntegrationTest
  setup do
    @admin = Member.create!(
      first_name: "Admin",
      last_name: "User",
      email: "admin-bucket@example.test",
      status: "active",
      is_admin: true,
      joined_at: Date.current
    )

    @designer = Member.create!(
      first_name: "Designer",
      last_name: "One",
      email: "designer-bucket@example.test",
      status: "active",
      is_admin: false,
      joined_at: Date.current
    )

    @project = Design::Project.create!(
      name: "Bucket Test Project",
      client_id: "client-test",
      client_name: "Client Bucket",
      phase: "offre",
      status: "active"
    )
  end

  # ── Bucket CRUD ──────────────────────────────────────────────

  test "list empty bucket" do
    get "/api/v1/projects/design-project/#{@project.id}/bucket"
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal [], body["transactions"]
    assert_equal 0.0, body["totalCredits"]
    assert_equal 0.0, body["totalDebits"]
    assert_equal 0.0, body["balance"]
  end

  test "create credit transaction" do
    post "/api/v1/projects/design-project/#{@project.id}/bucket",
      params: { kind: "credit", amount: 600.0, description: "Facturation 10h", date: "2026-04-01" },
      headers: { "X-Member-Id" => @admin.id.to_s }

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "credit", body["kind"]
    assert_equal 600.0, body["amount"]
    assert_equal "Facturation 10h", body["description"]
    assert_equal "2026-04-01", body["date"]
    assert_equal @admin.id.to_s, body["recordedById"]
  end

  test "create debit transaction with member" do
    post "/api/v1/projects/design-project/#{@project.id}/bucket",
      params: { kind: "debit", amount: 350.0, description: "Paiement designer", date: "2026-04-05", member_id: @designer.id },
      headers: { "X-Member-Id" => @admin.id.to_s }

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "debit", body["kind"]
    assert_equal 350.0, body["amount"]
    assert_equal @designer.id.to_s, body["memberId"]
    assert_equal "Designer One", body["memberName"]
  end

  test "bucket balance is computed correctly" do
    # Add credit
    post "/api/v1/projects/design-project/#{@project.id}/bucket",
      params: { kind: "credit", amount: 1000.0, description: "Facture 1", date: "2026-04-01" },
      headers: { "X-Member-Id" => @admin.id.to_s }
    assert_response :created

    # Add debit
    post "/api/v1/projects/design-project/#{@project.id}/bucket",
      params: { kind: "debit", amount: 400.0, description: "Paiement A", date: "2026-04-05", member_id: @designer.id },
      headers: { "X-Member-Id" => @admin.id.to_s }
    assert_response :created

    # Check balance
    get "/api/v1/projects/design-project/#{@project.id}/bucket"
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body["transactions"].size
    assert_equal 1000.0, body["totalCredits"]
    assert_equal 400.0, body["totalDebits"]
    assert_equal 600.0, body["balance"]
  end

  test "delete (soft-delete) a bucket transaction" do
    post "/api/v1/projects/design-project/#{@project.id}/bucket",
      params: { kind: "credit", amount: 500.0, description: "To delete", date: "2026-04-01" },
      headers: { "X-Member-Id" => @admin.id.to_s }
    assert_response :created
    txn_id = JSON.parse(response.body)["id"]

    delete "/api/v1/bucket/#{txn_id}",
      headers: { "X-Member-Id" => @admin.id.to_s }
    assert_response :no_content

    # Verify it's gone from listing
    get "/api/v1/projects/design-project/#{@project.id}/bucket"
    body = JSON.parse(response.body)
    assert_equal 0, body["transactions"].size
    assert_equal 0.0, body["balance"]
  end

  test "debit requires member_id" do
    post "/api/v1/projects/design-project/#{@project.id}/bucket",
      params: { kind: "debit", amount: 100.0, description: "No member", date: "2026-04-01" },
      headers: { "X-Member-Id" => @admin.id.to_s }
    assert_response :unprocessable_entity
  end

  test "bucket works for lab project (PoleProject)" do
    pole_project = PoleProject.create!(name: "Lab Project", pole: "design")

    post "/api/v1/projects/lab-project/#{pole_project.id}/bucket",
      params: { kind: "credit", amount: 200.0, description: "Lab credit", date: "2026-04-01" },
      headers: { "X-Member-Id" => @admin.id.to_s }
    assert_response :created

    get "/api/v1/projects/lab-project/#{pole_project.id}/bucket"
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body["transactions"].size
    assert_equal 200.0, body["balance"]
  end

  # ── Billing Config ───────────────────────────────────────────

  test "read billing config" do
    get "/api/v1/billing-config"
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 60.0, body["hourlyRate"]
    assert_equal 0.15, body["asblSupportRate"]
  end

  test "update billing config" do
    patch "/api/v1/billing-config",
      params: { hourly_rate: 75.0, asbl_support_rate: 0.12 },
      headers: { "X-Member-Id" => @admin.id.to_s }
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 75.0, body["hourlyRate"]
    assert_equal 0.12, body["asblSupportRate"]
  end

  # ── Billing Overview ─────────────────────────────────────────

  test "billing overview returns project summaries" do
    get "/api/v1/design/billing-overview"
    assert_response :success
    body = JSON.parse(response.body)
    assert body.key?("config")
    assert body.key?("totals")
    assert body.key?("projects")
    assert_equal 60.0, body["config"]["hourlyRate"]
  end
end
