# frozen_string_literal: true

require "test_helper"

class BankSync::ReconcilerTest < ActiveSupport::TestCase
  setup do
    BankReconciliation.delete_all
    BankTransaction.delete_all
    BankConnection.delete_all
    Expense.delete_all
    Revenue.delete_all

    @admin = Member.find_or_create_by!(email: "admin@test.local") do |m|
      m.first_name = "Admin"
      m.last_name = "Test"
      m.password = "password123"
      m.is_admin = true
    end

    @connection = BankConnection.create!(
      provider: "gocardless",
      bank_name: "Triodos",
      status: "linked",
      connected_by: @admin
    )
  end

  test "reconcile_all matches expense with exact amount and close date" do
    tx = BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_rec_auto_001",
      date: Date.new(2026, 3, 15),
      amount: -302.50,
      counterpart_name: "Pépinière du Soleil"
    )

    Expense.create!(
      name: "Plants de haie",
      supplier: "Pépinière du Soleil",
      status: "paid",
      expense_type: "services_and_goods",
      invoice_date: Date.new(2026, 3, 14),
      total_incl_vat: 302.50,
      amount_excl_vat: 250.00
    )

    reconciler = BankSync::Reconciler.new
    result = reconciler.reconcile_all

    assert result[:auto_matched] >= 1
    tx.reload
    assert_equal "matched", tx.status
    assert tx.bank_reconciliation.present?
    assert_equal "Expense", tx.bank_reconciliation.reconcilable_type
  end

  test "reconcile_all matches revenue with exact amount and close date" do
    tx = BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_rec_rev_001",
      date: Date.new(2026, 3, 20),
      amount: 1500.00,
      counterpart_name: "Client Formation"
    )

    contact = Contact.find_or_create_by!(name: "Client Formation", contact_type: "organization")
    Revenue.create!(
      amount: 1500.00,
      amount_excl_vat: 1240.00,
      date: Date.new(2026, 3, 19),
      contact: contact,
      status: "confirmed",
      label: "Formation permaculture"
    )

    reconciler = BankSync::Reconciler.new
    result = reconciler.reconcile_all

    assert result[:auto_matched] >= 1
    tx.reload
    assert_equal "matched", tx.status
  end

  test "find_candidates returns scored candidates for debit transaction" do
    tx = BankTransaction.new(
      bank_connection: @connection,
      provider_transaction_id: "tx_cand_test",
      date: Date.new(2026, 3, 15),
      amount: -100.00,
      counterpart_name: "Test Supplier"
    )
    tx.save!

    Expense.create!(
      name: "Matching expense",
      supplier: "Test Supplier",
      status: "paid",
      expense_type: "services_and_goods",
      invoice_date: Date.new(2026, 3, 15),
      total_incl_vat: 100.00,
      amount_excl_vat: 82.64
    )

    Expense.create!(
      name: "Non-matching expense",
      supplier: "Other",
      status: "paid",
      expense_type: "services_and_goods",
      invoice_date: Date.new(2026, 1, 1),
      total_incl_vat: 999.99,
      amount_excl_vat: 826.44
    )

    reconciler = BankSync::Reconciler.new
    candidates = reconciler.find_candidates(tx)

    assert candidates.size >= 1
    assert_equal "Matching expense", candidates.first[:record].name
    assert candidates.first[:score] > candidates.last[:score] if candidates.size > 1
  end

  test "does not match already reconciled records" do
    expense = Expense.create!(
      name: "Already matched",
      supplier: "Supplier",
      status: "paid",
      expense_type: "services_and_goods",
      invoice_date: Date.new(2026, 3, 15),
      total_incl_vat: 200.00,
      amount_excl_vat: 165.29
    )

    tx1 = BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_already_001",
      date: Date.new(2026, 3, 15),
      amount: -200.00
    )

    BankReconciliation.create!(
      bank_transaction: tx1,
      reconcilable: expense,
      confidence: "manual"
    )

    tx2 = BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_already_002",
      date: Date.new(2026, 3, 15),
      amount: -200.00
    )

    reconciler = BankSync::Reconciler.new
    candidates = reconciler.find_candidates(tx2)

    # The already-matched expense should not appear
    assert candidates.none? { |c| c[:record].id == expense.id }
  end
end
