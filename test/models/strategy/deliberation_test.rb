require "test_helper"

class Strategy::DeliberationTest < ActiveSupport::TestCase
  setup do
    Strategy::Reaction.delete_all
    Strategy::ProposalVersion.delete_all
    Strategy::Proposal.delete_all
    Strategy::DeliberationComment.delete_all
    Strategy::Deliberation.delete_all
    @member = Member.first || Member.create!(
      first_name: "Test", last_name: "User", email: "test@semisto.org",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
  end

  test "default status is draft" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id)
    assert_equal "draft", delib.status
  end

  test "STATUSES contains the six phase values" do
    assert_equal %w[draft open voting outcome_pending decided cancelled], Strategy::Deliberation::STATUSES
  end

  test "publish! sets status to open and opened_at" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id)
    delib.proposals.create!(content: "<p>Proposition</p>", author: @member)
    freeze_time = Time.zone.parse("2026-04-13 10:00:00")
    travel_to(freeze_time) do
      delib.publish!
    end
    assert_equal "open", delib.status
    assert_equal freeze_time, delib.opened_at
  end

  test "publish! raises when no proposal exists" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id)
    assert_raises(RuntimeError) { delib.publish! }
  end

  test "transition_to_voting! sets status, voting_started_at and voting_deadline" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id, status: "open")
    freeze_time = Time.zone.parse("2026-04-28 10:00:00")
    travel_to(freeze_time) do
      delib.transition_to_voting!
    end
    assert_equal "voting", delib.status
    assert_equal freeze_time, delib.voting_started_at
    assert_equal freeze_time + 7.days, delib.voting_deadline
  end

  test "transition_to_outcome_pending! sets status" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id, status: "voting")
    delib.transition_to_outcome_pending!
    assert_equal "outcome_pending", delib.status
  end

  test "extend_voting! resets voting_deadline to now + 7 days" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id, status: "voting")
    freeze_time = Time.zone.parse("2026-05-01 10:00:00")
    travel_to(freeze_time) do
      delib.extend_voting!
    end
    assert_equal freeze_time + 7.days, delib.voting_deadline
  end

  test "cancel! sets status to cancelled" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id, status: "open")
    delib.cancel!
    assert_equal "cancelled", delib.status
  end

  test "cancel! raises when deliberation is already decided" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id, status: "decided")
    assert_raises(RuntimeError) { delib.cancel! }
  end

  test "visible_to hides other members' drafts" do
    other = Member.create!(
      first_name: "Other", last_name: "User", email: "other@semisto.org",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
    mine = Strategy::Deliberation.create!(title: "Mine draft", created_by_id: @member.id, status: "draft")
    theirs = Strategy::Deliberation.create!(title: "Theirs draft", created_by_id: other.id, status: "draft")
    shared = Strategy::Deliberation.create!(title: "Open to all", created_by_id: other.id, status: "open")

    visible = Strategy::Deliberation.visible_to(@member).pluck(:id)
    assert_includes visible, mine.id
    assert_not_includes visible, theirs.id
    assert_includes visible, shared.id
  end

  test "discussion_deadline is opened_at + 15 days" do
    opened = Time.zone.parse("2026-04-13 10:00:00")
    delib = Strategy::Deliberation.create!(
      title: "Sujet", created_by_id: @member.id, status: "open", opened_at: opened
    )
    assert_equal opened + 15.days, delib.discussion_deadline
  end

  test "comment records phase_at_creation from deliberation status" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id, status: "open", opened_at: Time.current)
    comment = delib.comments.create!(content: "Remarque", author: @member)
    assert_equal "open", comment.phase_at_creation
  end

  test "comment phase_at_creation explicit set wins" do
    delib = Strategy::Deliberation.create!(
      title: "Sujet", created_by_id: @member.id, status: "voting",
      voting_started_at: Time.current, voting_deadline: 7.days.from_now
    )
    comment = delib.comments.create!(content: "Forced", author: @member, phase_at_creation: "draft")
    assert_equal "draft", comment.phase_at_creation
  end
end
