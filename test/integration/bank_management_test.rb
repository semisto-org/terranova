# frozen_string_literal: true

require "test_helper"

class BankManagementTest < ActionDispatch::IntegrationTest
  setup do
    BankReconciliation.delete_all
    BankTransaction.delete_all
    BankConnection.delete_all

    @admin = Member.find_or_create_by!(email: "admin@test.local") do |m|
      m.first_name = "Admin"
      m.last_name = "Test"
      m.password = "password123"
      m.is_admin = true
    end

    @connection = BankConnection.create!(
      provider: "gocardless",
      provider_requisition_id: "req_test_123",
      provider_account_id: "acc_test_123",
      bank_name: "Triodos",
      iban: "BE12 5230 8000 1234",
      status: "linked",
      consent_expires_at: 60.days.from_now,
      last_synced_at: 1.hour.ago,
      connected_by: @admin
    )
  end

  test "list connections returns active connections" do
    get "/api/v1/bank/connections", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 1, body["items"].size
    assert_equal "Triodos", body["items"][0]["bankName"]
    assert_equal "linked", body["items"][0]["status"]
  end

  test "list transactions returns empty when no transactions" do
    get "/api/v1/bank/transactions", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 0, body["items"].size
  end

  test "list transactions with filters" do
    BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_001",
      date: Date.new(2026, 3, 15),
      amount: -150.00,
      counterpart_name: "Fournisseur A",
      remittance_info: "Facture 2026-001"
    )
    BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_002",
      date: Date.new(2026, 3, 20),
      amount: 500.00,
      counterpart_name: "Client B",
      remittance_info: "Paiement formation"
    )

    # All transactions
    get "/api/v1/bank/transactions", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body["items"].size

    # Filter by status
    get "/api/v1/bank/transactions", params: { status: "unmatched" }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body["items"].size

    # Filter by date
    get "/api/v1/bank/transactions", params: { date_from: "2026-03-18" }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body["items"].size
    assert_equal "Client B", body["items"][0]["counterpartName"]
  end

  test "manual reconciliation creates and destroys correctly" do
    tx = BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_rec_001",
      date: Date.new(2026, 3, 15),
      amount: -250.00,
      counterpart_name: "Pépinière du Soleil"
    )

    expense = Expense.create!(
      name: "Plants de haie",
      supplier: "Pépinière du Soleil",
      status: "paid",
      expense_type: "services_and_goods",
      invoice_date: Date.new(2026, 3, 14),
      total_incl_vat: 250.00,
      amount_excl_vat: 206.61
    )

    # Create reconciliation
    post "/api/v1/bank/reconciliations", params: {
      bank_transaction_id: tx.id,
      reconcilable_type: "Expense",
      reconcilable_id: expense.id
    }, as: :json
    assert_response :created

    body = JSON.parse(response.body)
    assert_equal "manual", body["confidence"]
    assert_equal "Expense", body["reconcilableType"]

    tx.reload
    assert_equal "matched", tx.status

    # Destroy reconciliation
    reconciliation_id = body["id"]
    delete "/api/v1/bank/reconciliations/#{reconciliation_id}", as: :json
    assert_response :no_content

    tx.reload
    assert_equal "unmatched", tx.status
  end

  test "ignore and unignore transaction" do
    tx = BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_ign_001",
      date: Date.current,
      amount: -5.00,
      counterpart_name: "Frais bancaires"
    )

    patch "/api/v1/bank/transactions/#{tx.id}/ignore", as: :json
    assert_response :success
    assert_equal "ignored", JSON.parse(response.body)["status"]

    patch "/api/v1/bank/transactions/#{tx.id}/unignore", as: :json
    assert_response :success
    assert_equal "unmatched", JSON.parse(response.body)["status"]
  end

  test "bank summary returns per-account data" do
    BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_sum_001",
      date: Date.current,
      amount: -100.00,
      status: "unmatched"
    )
    BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_sum_002",
      date: Date.current,
      amount: 200.00,
      status: "matched"
    )

    get "/api/v1/bank/summary", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 1, body["accounts"].size
    assert_equal "BE12 5230 8000 1234", body["accounts"][0]["iban"]
    assert_equal "general", body["accounts"][0]["scope"]
    assert_equal 1, body["accounts"][0]["unmatchedCount"]
    assert_equal 1, body["accounts"][0]["matchedCount"]
    assert_equal 1, body["totals"]["unmatchedCount"]
    assert_equal 1, body["totals"]["matchedCount"]
  end

  test "candidates endpoint returns matching expenses for debit" do
    tx = BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_cand_001",
      date: Date.new(2026, 3, 15),
      amount: -302.50,
      counterpart_name: "Jardinerie Verte"
    )

    Expense.create!(
      name: "Outils de jardin",
      supplier: "Jardinerie Verte",
      status: "paid",
      expense_type: "services_and_goods",
      invoice_date: Date.new(2026, 3, 14),
      total_incl_vat: 302.50,
      amount_excl_vat: 250.00
    )

    get "/api/v1/bank/transactions/#{tx.id}/candidates", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body["items"].size >= 1
    assert_equal "Expense", body["items"][0]["type"]
    assert body["items"][0]["score"] >= 50
  end

  test "duplicate reconciliation is rejected" do
    tx = BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_dup_001",
      date: Date.current,
      amount: -100.00
    )
    expense = Expense.create!(
      name: "Test", supplier: "Test", status: "paid",
      expense_type: "services_and_goods", invoice_date: Date.current,
      total_incl_vat: 100.00, amount_excl_vat: 82.64
    )

    # First reconciliation succeeds
    post "/api/v1/bank/reconciliations", params: {
      bank_transaction_id: tx.id, reconcilable_type: "Expense", reconcilable_id: expense.id
    }, as: :json
    assert_response :created

    # Second reconciliation for same transaction fails
    expense2 = Expense.create!(
      name: "Test2", supplier: "Test2", status: "paid",
      expense_type: "services_and_goods", invoice_date: Date.current,
      total_incl_vat: 100.00, amount_excl_vat: 82.64
    )
    post "/api/v1/bank/reconciliations", params: {
      bank_transaction_id: tx.id, reconcilable_type: "Expense", reconcilable_id: expense2.id
    }, as: :json
    assert_response :unprocessable_entity
  end

  # --- Multi-account tests ---

  test "summary returns multiple accounts with totals" do
    vdk_connection = BankConnection.create!(
      provider: "gocardless",
      provider_requisition_id: "req_vdk_123",
      provider_account_id: "acc_vdk_123",
      institution_id: "VDK_VDSPBE22",
      bank_name: "VDK",
      iban: "BE98 6511 0000 5678",
      status: "linked",
      accounting_scope: "nursery",
      consent_expires_at: 60.days.from_now,
      connected_by: @admin
    )

    BankTransaction.create!(bank_connection: @connection, provider_transaction_id: "tx_ma_001", date: Date.current, amount: -50.00, status: "unmatched")
    BankTransaction.create!(bank_connection: @connection, provider_transaction_id: "tx_ma_002", date: Date.current, amount: 100.00, status: "matched")
    BankTransaction.create!(bank_connection: vdk_connection, provider_transaction_id: "tx_ma_003", date: Date.current, amount: -30.00, status: "unmatched")

    get "/api/v1/bank/summary", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 2, body["accounts"].size

    triodos = body["accounts"].find { |a| a["bankName"] == "Triodos" }
    vdk = body["accounts"].find { |a| a["bankName"] == "VDK" }

    assert_equal "general", triodos["scope"]
    assert_equal 1, triodos["unmatchedCount"]
    assert_equal 1, triodos["matchedCount"]

    assert_equal "nursery", vdk["scope"]
    assert_equal 1, vdk["unmatchedCount"]
    assert_equal 0, vdk["matchedCount"]

    assert_equal 2, body["totals"]["unmatchedCount"]
    assert_equal 1, body["totals"]["matchedCount"]
  end

  test "transactions filtered by connection_id" do
    vdk_connection = BankConnection.create!(
      provider: "gocardless",
      provider_account_id: "acc_vdk_filter",
      bank_name: "VDK",
      status: "linked",
      accounting_scope: "nursery",
      consent_expires_at: 60.days.from_now,
      connected_by: @admin
    )

    BankTransaction.create!(bank_connection: @connection, provider_transaction_id: "tx_filt_001", date: Date.current, amount: -100.00)
    BankTransaction.create!(bank_connection: vdk_connection, provider_transaction_id: "tx_filt_002", date: Date.current, amount: -200.00)

    # All transactions
    get "/api/v1/bank/transactions", as: :json
    assert_equal 2, JSON.parse(response.body)["items"].size

    # Only Triodos
    get "/api/v1/bank/transactions", params: { connection_id: @connection.id }, as: :json
    items = JSON.parse(response.body)["items"]
    assert_equal 1, items.size
    assert_equal @connection.id.to_s, items[0]["connectionId"]

    # Only VDK
    get "/api/v1/bank/transactions", params: { connection_id: vdk_connection.id }, as: :json
    items = JSON.parse(response.body)["items"]
    assert_equal 1, items.size
    assert_equal "VDK", items[0]["bankName"]
  end

  # --- CODA import tests ---

  test "create manual CODA connection" do
    post "/api/v1/bank/connections", params: {
      bank_name: "VDK",
      iban: "BE98 6511 0000 5678",
      accounting_scope: "nursery"
    }, as: :json
    assert_response :created

    body = JSON.parse(response.body)
    assert_equal "VDK", body["bankName"]
    assert_equal "coda_import", body["provider"]
    assert_equal "nursery", body["accountingScope"]
    assert_equal "BE98 6511 0000 5678", body["iban"]
    assert_equal "linked", body["status"]
  end

  test "create connection defaults to general scope" do
    post "/api/v1/bank/connections", params: {
      bank_name: "Triodos",
      iban: "BE52 5230 8000 1234"
    }, as: :json
    assert_response :created

    body = JSON.parse(response.body)
    assert_equal "general", body["accountingScope"]
  end

  test "create connection requires bank_name" do
    post "/api/v1/bank/connections", params: { iban: "BE52 5230 8000 1234" }, as: :json
    assert_response :bad_request
  end

  test "upload CODA file imports transactions" do
    coda_connection = BankConnection.create!(
      provider: "coda_import",
      bank_name: "Triodos",
      iban: "BE52523080001234",
      status: "linked",
      accounting_scope: "general",
      connected_by: @admin
    )

    coda_content = build_test_coda
    file = Rack::Test::UploadedFile.new(
      StringIO.new(coda_content),
      "text/plain",
      false,
      original_filename: "test.cod"
    )

    post "/api/v1/bank/connections/#{coda_connection.id}/upload_coda",
      params: { file: file }
    assert_response :success

    body = JSON.parse(response.body)
    assert body["imported"] >= 1
    assert_equal 0, body["skipped"]
    assert_not_nil body["lastSyncedAt"]

    assert coda_connection.bank_transactions.count >= 1
  end

  test "upload CODA file deduplicates on re-upload" do
    coda_connection = BankConnection.create!(
      provider: "coda_import",
      bank_name: "Triodos",
      iban: "BE52523080001234",
      status: "linked",
      accounting_scope: "general",
      connected_by: @admin
    )

    coda_content = build_test_coda

    # First upload
    file1 = Rack::Test::UploadedFile.new(
      StringIO.new(coda_content), "text/plain", false, original_filename: "test.cod"
    )
    post "/api/v1/bank/connections/#{coda_connection.id}/upload_coda", params: { file: file1 }
    assert_response :success
    first_body = JSON.parse(response.body)
    assert first_body["imported"] >= 1

    # Second upload of same file
    file2 = Rack::Test::UploadedFile.new(
      StringIO.new(coda_content), "text/plain", false, original_filename: "test.cod"
    )
    post "/api/v1/bank/connections/#{coda_connection.id}/upload_coda", params: { file: file2 }
    assert_response :success
    second_body = JSON.parse(response.body)
    assert_equal 0, second_body["imported"]
    assert second_body["skipped"] >= 1
  end

  test "upload invalid CODA file returns error" do
    coda_connection = BankConnection.create!(
      provider: "coda_import",
      bank_name: "Triodos",
      status: "linked",
      connected_by: @admin
    )

    file = Rack::Test::UploadedFile.new(
      StringIO.new("This is not a CODA file"), "text/plain", false, original_filename: "bad.cod"
    )
    post "/api/v1/bank/connections/#{coda_connection.id}/upload_coda", params: { file: file }
    assert_response :unprocessable_entity

    body = JSON.parse(response.body)
    assert body["error"].include?("CODA")
  end

  test "delete CODA connection does not call GoCardless API" do
    coda_connection = BankConnection.create!(
      provider: "coda_import",
      bank_name: "VDK",
      status: "linked",
      accounting_scope: "nursery",
      connected_by: @admin
    )

    delete "/api/v1/bank/connections/#{coda_connection.id}", as: :json
    assert_response :no_content
    assert_nil BankConnection.find_by(id: coda_connection.id)
  end

  test "connection serialization includes accountingScope and institutionId" do
    @connection.update!(institution_id: "TRIODOS_TRIOBEBB", accounting_scope: "general")

    get "/api/v1/bank/connections", as: :json
    assert_response :success

    conn = JSON.parse(response.body)["items"][0]
    assert_equal "general", conn["accountingScope"]
    assert_equal "TRIODOS_TRIOBEBB", conn["institutionId"]
  end

  private

  def build_test_coda
    lines = [
      "0000018032600105        00000000   Semisto ASBL              BBRUBEBB   00932942  00000                                         2",
      "10000BE52523080001234 EUR0000000012345670260301          Semisto ASBL              000                                        0",
      "2100010000BANKREF00000000000001000000000001500000260315008010000101123456781234500012                                   260315 0",
      "2200010000                                                          VDSPBE22   BE98651100005678          00000000000000000     0",
      "2300010000Pépinière du Soleil                   Communication libre test                         0 00000000000150000260315     0",
      "8000BE52523080001234 EUR0000000013845670260315                                                                                0",
      "9               000003000000000015000000000000000001500000                                                                    2"
    ]
    lines.map { |l| l.ljust(128) }.join("\n")
  end
end
