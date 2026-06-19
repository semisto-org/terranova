require "test_helper"

class MemberTest < ActiveSupport::TestCase
  test "can_access_strategy? returns true for effective members" do
    m = Member.new(membership_type: "effective")
    assert m.can_access_strategy?
  end

  test "can_access_strategy? returns false for adherent members" do
    m = Member.new(membership_type: "adherent")
    assert_not m.can_access_strategy?
  end

  test "can_access_strategy? returns false for non_member" do
    m = Member.new(membership_type: "non_member")
    assert_not m.can_access_strategy?
  end

  # Heures calmes (#106) — fenêtre de push par défaut 8h–19h Europe/Brussels.
  test "email_push_allowed_at? respects the default 8h-19h Brussels window" do
    m = Member.new(quiet_hours_start_hour: 19, quiet_hours_end_hour: 8)
    # Juin = CEST (UTC+2).
    assert m.email_push_allowed_at?(Time.utc(2026, 6, 19, 9, 0))      # 11h Bruxelles
    assert_not m.email_push_allowed_at?(Time.utc(2026, 6, 19, 4, 0))  # 6h Bruxelles
    assert_not m.email_push_allowed_at?(Time.utc(2026, 6, 19, 20, 0)) # 22h Bruxelles
  end

  test "email_push_allowed_at? supports a push window crossing midnight" do
    # Plage de push 22h–6h (silence en pleine journée) : end(22) > start(6).
    m = Member.new(quiet_hours_start_hour: 6, quiet_hours_end_hour: 22)
    assert m.email_push_allowed_at?(Time.utc(2026, 6, 19, 21, 0))     # 23h Bruxelles
    assert m.email_push_allowed_at?(Time.utc(2026, 6, 19, 2, 0))      # 4h Bruxelles
    assert_not m.email_push_allowed_at?(Time.utc(2026, 6, 19, 10, 0)) # 12h Bruxelles
  end
end
