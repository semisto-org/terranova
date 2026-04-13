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
end
