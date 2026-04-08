# frozen_string_literal: true

require "test_helper"

class BankConnectionTest < ActiveSupport::TestCase
  setup do
    @admin = Member.find_or_create_by!(email: "admin@test.local") do |m|
      m.first_name = "Admin"
      m.last_name = "Test"
      m.password = "password123"
      m.is_admin = true
    end
  end

  test "valid connection" do
    conn = BankConnection.new(
      provider: "gocardless",
      bank_name: "Triodos",
      status: "linked",
      connected_by: @admin
    )
    assert conn.valid?
  end

  test "requires provider and bank_name" do
    conn = BankConnection.new(connected_by: @admin)
    assert_not conn.valid?
    assert conn.errors[:provider].any?
    assert conn.errors[:bank_name].any?
  end

  test "consent_expiring_soon? returns true within 30 days" do
    conn = BankConnection.new(consent_expires_at: 20.days.from_now)
    assert conn.consent_expiring_soon?

    conn.consent_expires_at = 60.days.from_now
    assert_not conn.consent_expiring_soon?
  end

  test "consent_expired? returns true when past" do
    conn = BankConnection.new(consent_expires_at: 1.day.ago)
    assert conn.consent_expired?

    conn.consent_expires_at = 1.day.from_now
    assert_not conn.consent_expired?
  end

  test "validates accounting_scope" do
    conn = BankConnection.new(
      provider: "gocardless", bank_name: "Test",
      status: "linked", connected_by: @admin,
      accounting_scope: "invalid"
    )
    assert_not conn.valid?
    assert conn.errors[:accounting_scope].any?
  end

  test "scope_poles returns nil for general scope" do
    conn = BankConnection.new(accounting_scope: "general")
    assert_nil conn.scope_poles
  end

  test "scope_poles returns nursery array for nursery scope" do
    conn = BankConnection.new(accounting_scope: "nursery")
    assert_equal %w[nursery], conn.scope_poles
  end

  test "default accounting_scope is general" do
    conn = BankConnection.new(
      provider: "gocardless", bank_name: "Test",
      status: "linked", connected_by: @admin
    )
    assert_equal "general", conn.accounting_scope
  end
end
