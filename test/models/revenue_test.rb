# frozen_string_literal: true

require "test_helper"

class RevenueTest < ActiveSupport::TestCase
  setup do
    @organization = Organization.find_or_create_by!(name: "Semisto Test") do |o|
      o.is_default = true
      o.vat_subject = true
    end
  end

  # `vat_rate` is a NOT NULL string column (default ""), but the admin revenue
  # form sends `null` when the VAT rate is blank. Without coercion this raises a
  # PG::NotNullViolation on update — regression guard for that 500.
  test "coerces nil vat_rate to empty string on create" do
    revenue = Revenue.create!(
      organization: @organization, status: "received", pole: "academy",
      amount: 150, amount_excl_vat: 150, vat_rate: nil
    )
    assert_equal "", revenue.reload.vat_rate
  end

  test "coerces nil vat_rate to empty string on update" do
    revenue = Revenue.create!(
      organization: @organization, status: "received", pole: "academy",
      amount: 150, amount_excl_vat: 150, vat_rate: "21"
    )
    assert_nothing_raised { revenue.update!(vat_rate: nil) }
    assert_equal "", revenue.reload.vat_rate
  end
end
