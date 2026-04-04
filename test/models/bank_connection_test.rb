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
end
