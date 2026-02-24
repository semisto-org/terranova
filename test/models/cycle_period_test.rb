require "test_helper"

class CyclePeriodTest < ActiveSupport::TestCase
  test "validates coherent dates" do
    cycle = CyclePeriod.new(
      name: "Cycle 1",
      starts_on: Date.new(2026, 1, 1),
      ends_on: Date.new(2026, 1, 14),
      cooldown_starts_on: Date.new(2026, 1, 10),
      cooldown_ends_on: Date.new(2026, 1, 20),
      color: "#123456",
      active: true
    )

    assert_not cycle.valid?
    assert_includes cycle.errors[:cooldown_starts_on], "doit être le même jour ou après la fin du cycle"

    cycle.cooldown_starts_on = Date.new(2026, 1, 15)
    cycle.cooldown_ends_on = Date.new(2026, 1, 14)
    assert_not cycle.valid?
    assert_includes cycle.errors[:cooldown_ends_on], "doit être après le début du cooldown"

    cycle.cooldown_ends_on = Date.new(2026, 1, 20)
    assert cycle.valid?
  end
end
