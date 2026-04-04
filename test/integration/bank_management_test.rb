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

  test "bank summary returns connection status" do
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
    assert body["connected"]
    assert_equal 1, body["unmatchedCount"]
    assert_equal 1, body["matchedCount"]
    assert_equal "BE12 5230 8000 1234", body["iban"]
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
end
