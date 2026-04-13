require "test_helper"

class Strategy::ReactionTest < ActiveSupport::TestCase
  setup do
    Strategy::Reaction.delete_all
    Strategy::ProposalVersion.delete_all
    Strategy::Proposal.delete_all
    Strategy::Deliberation.delete_all
    @member = Member.first || Member.create!(
      first_name: "Test", last_name: "User", email: "test@semisto.org",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
    @other = Member.where.not(id: @member.id).first || Member.create!(
      first_name: "Other", last_name: "User", email: "other@semisto.org",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
    @delib = Strategy::Deliberation.create!(
      title: "Sujet", created_by_id: @member.id, status: "voting",
      voting_started_at: 1.day.ago, voting_deadline: 6.days.from_now
    )
    @proposal = @delib.proposals.create!(content: "<p>Initial</p>", author: @member)
  end

  test "POSITIONS only allows consent and objection" do
    assert_equal %w[consent objection], Strategy::Reaction::POSITIONS
  end

  test "objection requires a rationale" do
    reaction = @proposal.reactions.build(member: @other, position: "objection", rationale: "")
    assert_not reaction.valid?
    assert_not_empty reaction.errors[:rationale]
  end

  test "consent does not require a rationale" do
    reaction = @proposal.reactions.build(member: @other, position: "consent", rationale: nil)
    assert reaction.valid?
  end

  test "creating an objection in voting phase extends voting_deadline" do
    frozen = Time.zone.parse("2026-05-01 12:00:00")
    travel_to(frozen) do
      @proposal.reactions.create!(member: @other, position: "objection", rationale: "Non, je ne suis pas d'accord.")
    end
    @delib.reload
    assert_equal frozen + 7.days, @delib.voting_deadline
  end

  test "creating a consent in voting phase does NOT extend voting_deadline" do
    original_deadline = @delib.voting_deadline
    @proposal.reactions.create!(member: @other, position: "consent", rationale: nil)
    @delib.reload
    assert_equal original_deadline.to_i, @delib.voting_deadline.to_i
  end

  test "only one reaction per member per proposal" do
    @proposal.reactions.create!(member: @other, position: "consent")
    duplicate = @proposal.reactions.build(member: @other, position: "objection", rationale: "Changed my mind")
    assert_not duplicate.save
  end
end
