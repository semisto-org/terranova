require "test_helper"
require "rake"

class StrategyRakeTest < ActiveSupport::TestCase
  setup do
    Rails.application.load_tasks if Rake::Task.tasks.empty?
    Rake::Task["strategy:advance_deliberations"].reenable

    Strategy::Reaction.delete_all
    Strategy::ProposalVersion.delete_all
    Strategy::Proposal.delete_all
    Strategy::DeliberationComment.delete_all
    Strategy::Deliberation.delete_all
    @member = Member.first || Member.create!(
      first_name: "Rake", last_name: "Runner", email: "rake@semisto.test",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
  end

  test "advances open deliberation to voting after 15 days" do
    delib = Strategy::Deliberation.create!(
      title: "Discussion en cours", created_by_id: @member.id,
      status: "open", opened_at: 16.days.ago
    )
    Rake::Task["strategy:advance_deliberations"].invoke
    delib.reload
    assert_equal "voting", delib.status
    assert_not_nil delib.voting_started_at
    assert_not_nil delib.voting_deadline
  end

  test "does not advance open deliberation before 15 days" do
    delib = Strategy::Deliberation.create!(
      title: "Discussion fraîche", created_by_id: @member.id,
      status: "open", opened_at: 10.days.ago
    )
    Rake::Task["strategy:advance_deliberations"].invoke
    delib.reload
    assert_equal "open", delib.status
  end

  test "advances voting deliberation to outcome_pending when deadline reached" do
    delib = Strategy::Deliberation.create!(
      title: "Vote terminé", created_by_id: @member.id,
      status: "voting", voting_started_at: 8.days.ago, voting_deadline: 1.minute.ago
    )
    Rake::Task["strategy:advance_deliberations"].invoke
    delib.reload
    assert_equal "outcome_pending", delib.status
  end

  test "does not advance voting deliberation before deadline" do
    delib = Strategy::Deliberation.create!(
      title: "Vote en cours", created_by_id: @member.id,
      status: "voting", voting_started_at: 2.days.ago, voting_deadline: 5.days.from_now
    )
    Rake::Task["strategy:advance_deliberations"].invoke
    delib.reload
    assert_equal "voting", delib.status
  end

  test "is idempotent when re-run" do
    delib = Strategy::Deliberation.create!(
      title: "Idempotence", created_by_id: @member.id,
      status: "open", opened_at: 16.days.ago
    )
    Rake::Task["strategy:advance_deliberations"].invoke
    Rake::Task["strategy:advance_deliberations"].reenable
    Rake::Task["strategy:advance_deliberations"].invoke
    delib.reload
    assert_equal "voting", delib.status
  end
end
