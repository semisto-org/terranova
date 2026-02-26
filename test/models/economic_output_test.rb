require "test_helper"

class EconomicOutputTest < ActiveSupport::TestCase
  test "valid without amount_cents" do
    record = EconomicOutput.new(
      date: Date.current,
      category: "harvest",
      quantity: 4,
      unit: "kg"
    )

    assert record.valid?
  end

  test "invalid negative amount_cents" do
    record = EconomicOutput.new(date: Date.current, category: "sale", amount_cents: -1, quantity: 1, unit: "kg")
    assert_not record.valid?
  end
end
