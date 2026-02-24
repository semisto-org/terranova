require "test_helper"

class EconomicInputTest < ActiveSupport::TestCase
  test "valid with required attributes" do
    record = EconomicInput.new(
      date: Date.current,
      category: "plants",
      amount_cents: 1000,
      quantity: 2,
      unit: "kg"
    )

    assert record.valid?
  end

  test "invalid category" do
    record = EconomicInput.new(date: Date.current, category: "bad", amount_cents: 100, quantity: 1, unit: "u")
    assert_not record.valid?
  end
end
