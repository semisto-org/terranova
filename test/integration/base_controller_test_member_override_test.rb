require "test_helper"

class BaseControllerTestMemberOverrideTest < ActionDispatch::IntegrationTest
  setup do
    [ MemberRole, Member, Wallet ].each(&:delete_all)

    @admin = Member.create!(
      first_name: "Admin",
      last_name: "User",
      email: "admin@example.test",
      avatar: "",
      status: "active",
      is_admin: true,
      joined_at: Date.current
    )

    @other = Member.create!(
      first_name: "Other",
      last_name: "User",
      email: "other@example.test",
      avatar: "",
      status: "active",
      is_admin: false,
      joined_at: Date.current
    )
  end

  teardown do
    Thread.current[:test_member] = nil
  end

  test "test_member picks up Thread.current override" do
    original = Member.find_by(is_admin: true) || Member.first
    other = Member.where.not(id: original.id).first
    skip "need at least 2 members" unless other

    Thread.current[:test_member] = other
    begin
      get "/api/v1/profile", as: :json
      assert_response :success
      body = JSON.parse(response.body)
      assert_equal other.id, body["id"].to_i
    ensure
      Thread.current[:test_member] = nil
    end
  end
end
