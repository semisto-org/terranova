# frozen_string_literal: true

require "test_helper"

class BankReconciliationTest < ActiveSupport::TestCase
  setup do
    BankReconciliation.delete_all
    BankTransaction.delete_all
    BankConnection.delete_all
    Expense.delete_all

    @admin = Member.find_or_create_by!(email: "admin-rec@test.local") do |m|
      m.first_name = "Admin"
      m.last_name = "Test"
      m.password = "password123"
      m.is_admin = true
      m.joined_at = Date.current
    end

    @organization = Organization.find_or_create_by!(name: "Semisto Test") do |o|
      o.is_default = true
      o.vat_subject = true
    end

    @connection = BankConnection.create!(
      provider: "gocardless", bank_name: "Triodos", status: "linked",
      accounting_scope: "general", organization: @organization, connected_by: @admin
    )
  end

  test "learns supplier IBAN on first reconciliation when contact has none" do
    contact = Contact.create!(name: "New Supplier", contact_type: "organization")
    expense = Expense.create!(
      name: "Invoice", supplier: contact.name, supplier_contact: contact,
      status: "paid", expense_type: "services_and_goods",
      invoice_date: Date.current, total_incl_vat: 100.00, amount_excl_vat: 82.64
    )
    tx = BankTransaction.create!(
      bank_connection: @connection, provider_transaction_id: "tx_learn_001",
      date: Date.current, amount: -100.00,
      counterpart_iban: "BE68 5390 0754 7034"
    )

    BankReconciliation.create!(bank_transaction: tx, reconcilable: expense, confidence: "manual", amount: 100.00)

    assert_equal "BE68539007547034", contact.reload.iban
  end

  test "does not overwrite existing supplier IBAN" do
    contact = Contact.create!(name: "Known Supplier", contact_type: "organization", iban: "BE11111111111111")
    expense = Expense.create!(
      name: "Invoice", supplier: contact.name, supplier_contact: contact,
      status: "paid", expense_type: "services_and_goods",
      invoice_date: Date.current, total_incl_vat: 50.00, amount_excl_vat: 41.32
    )
    tx = BankTransaction.create!(
      bank_connection: @connection, provider_transaction_id: "tx_learn_002",
      date: Date.current, amount: -50.00,
      counterpart_iban: "FR7630006000011234567890189"
    )

    BankReconciliation.create!(bank_transaction: tx, reconcilable: expense, confidence: "manual", amount: 50.00)

    assert_equal "BE11111111111111", contact.reload.iban
  end

  test "does nothing when transaction has no counterpart IBAN" do
    contact = Contact.create!(name: "No IBAN Supplier", contact_type: "organization")
    expense = Expense.create!(
      name: "Invoice", supplier: contact.name, supplier_contact: contact,
      status: "paid", expense_type: "services_and_goods",
      invoice_date: Date.current, total_incl_vat: 10.00, amount_excl_vat: 8.26
    )
    tx = BankTransaction.create!(
      bank_connection: @connection, provider_transaction_id: "tx_learn_003",
      date: Date.current, amount: -10.00
    )

    BankReconciliation.create!(bank_transaction: tx, reconcilable: expense, confidence: "manual", amount: 10.00)

    assert_nil contact.reload.iban
  end
end
