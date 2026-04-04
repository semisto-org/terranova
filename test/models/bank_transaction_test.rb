# frozen_string_literal: true

require "test_helper"

class BankTransactionTest < ActiveSupport::TestCase
  setup do
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

  test "valid transaction" do
    tx = BankTransaction.new(
      bank_connection: @connection,
      provider_transaction_id: "tx_test_001",
      date: Date.current,
      amount: -150.00
    )
    assert tx.valid?
  end

  test "requires unique provider_transaction_id" do
    BankTransaction.create!(
      bank_connection: @connection,
      provider_transaction_id: "tx_uniq_001",
      date: Date.current,
      amount: -50.00
    )
    tx = BankTransaction.new(
      bank_connection: @connection,
      provider_transaction_id: "tx_uniq_001",
      date: Date.current,
      amount: -50.00
    )
    assert_not tx.valid?
    assert tx.errors[:provider_transaction_id].any?
  end

  test "debit? and credit? helpers" do
    tx = BankTransaction.new(amount: -100)
    assert tx.debit?
    assert_not tx.credit?

    tx.amount = 200
    assert tx.credit?
    assert_not tx.debit?
  end

  test "scopes filter correctly" do
    BankTransaction.create!(bank_connection: @connection, provider_transaction_id: "tx_s1", date: Date.current, amount: -100, status: "unmatched")
    BankTransaction.create!(bank_connection: @connection, provider_transaction_id: "tx_s2", date: Date.current, amount: 200, status: "matched")
    BankTransaction.create!(bank_connection: @connection, provider_transaction_id: "tx_s3", date: Date.current, amount: -50, status: "ignored")

    assert_equal 1, BankTransaction.unmatched.count
    assert_equal 1, BankTransaction.matched.count
    assert_equal 1, BankTransaction.ignored.count
    assert_equal 2, BankTransaction.debits.count
    assert_equal 1, BankTransaction.credits.count
  end
end
