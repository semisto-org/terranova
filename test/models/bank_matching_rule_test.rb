# frozen_string_literal: true

require "test_helper"

class BankMatchingRuleTest < ActiveSupport::TestCase
  setup do
    @organization = Organization.find_or_create_by!(name: "Rules Test Org") do |o|
      o.is_default = true
      o.vat_subject = true
    end
    @contact = Contact.create!(name: "STIB-MIVB", contact_type: "organization")
    @connection = BankConnection.create!(
      provider: "coda_import", bank_name: "Triodos Test",
      status: "linked", accounting_scope: "general",
      organization: @organization,
      connected_by: Member.where(is_admin: true).first
    )
  end

  test "requires at least one suggestion" do
    rule = BankMatchingRule.new(
      pattern_field: "counterpart_name", pattern_value: "STIB", organization: @organization
    )
    assert_not rule.valid?
    assert rule.errors[:base].any?
  end

  test "applicable_to finds matching rules for transaction" do
    rule = BankMatchingRule.create!(
      organization: @organization,
      pattern_field: "counterpart_name",
      pattern_value: "STIB",
      suggested_supplier_contact: @contact
    )

    tx = BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "test_rule_1",
      date: Date.current, amount: -55.0,
      counterpart_name: "STIB-MIVB Brussels"
    )

    assert_includes BankMatchingRule.applicable_to(tx), rule
  end

  test "applicable_to is case-insensitive substring" do
    rule = BankMatchingRule.create!(
      pattern_field: "counterpart_name", pattern_value: "Stib",
      suggested_supplier_contact: @contact
    )

    tx = BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "test_rule_2",
      date: Date.current, amount: -55.0,
      counterpart_name: "STIB mivb"
    )

    assert_includes BankMatchingRule.applicable_to(tx), rule
  end

  test "apply_to_expense sets suggested fields only when empty" do
    rule = BankMatchingRule.create!(
      organization: @organization,
      pattern_field: "counterpart_name", pattern_value: "STIB",
      suggested_supplier_contact: @contact,
      suggested_expense_type: "services_and_goods",
      suggested_vat_rate: "6"
    )

    expense = Expense.new
    rule.apply_to_expense(expense)

    assert_equal @contact.id, expense.supplier_contact_id
    assert_equal "services_and_goods", expense.expense_type
    assert_equal "6", expense.vat_rate
  end

  test "global rules match all organizations" do
    global_rule = BankMatchingRule.create!(
      organization_id: nil,
      pattern_field: "counterpart_name", pattern_value: "GLOBAL",
      suggested_supplier_contact: @contact
    )

    other_org = Organization.create!(name: "Other Org")
    other_conn = BankConnection.create!(
      provider: "coda_import", bank_name: "Other Bank",
      status: "linked", accounting_scope: "general",
      organization: other_org,
      connected_by: Member.where(is_admin: true).first
    )
    tx = BankTransaction.create!(
      bank_connection: other_conn,
      provider_transaction_id: "test_global_1",
      date: Date.current, amount: -10.0,
      counterpart_name: "GLOBAL Merchant"
    )

    assert_includes BankMatchingRule.applicable_to(tx), global_rule
  end
end
