require "test_helper"

class Strategy::ProposalTest < ActiveSupport::TestCase
  setup do
    Strategy::Reaction.delete_all
    Strategy::ProposalVersion.delete_all
    Strategy::Proposal.delete_all
    Strategy::Deliberation.delete_all
    @member = Member.first || Member.create!(
      first_name: "Test", last_name: "User", email: "test@semisto.org",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
    @delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id)
  end

  test "creating a proposal records version 1 automatically" do
    proposal = @delib.proposals.create!(content: "<p>Version 1 content</p>", author: @member)
    assert_equal 1, proposal.version
    assert_equal 1, proposal.versions.count
    v1 = proposal.versions.first
    assert_equal 1, v1.version
    assert_equal "<p>Version 1 content</p>", v1.content
  end

  test "record_new_version! increments version, creates ProposalVersion, updates content" do
    proposal = @delib.proposals.create!(content: "<p>Version 1</p>", author: @member)
    proposal.record_new_version!("<p>Version 2</p>")

    proposal.reload
    assert_equal 2, proposal.version
    assert_equal "<p>Version 2</p>", proposal.content
    assert_equal 2, proposal.versions.count
    assert_equal ["<p>Version 1</p>", "<p>Version 2</p>"], proposal.versions.chronological.map(&:content)
  end

  test "only one proposal allowed per deliberation" do
    @delib.proposals.create!(content: "<p>Première</p>", author: @member)
    duplicate = @delib.proposals.build(content: "<p>Deuxième</p>", author: @member)
    assert_not duplicate.save
    assert_includes duplicate.errors.full_messages.to_s.downcase, "deliberation"
  end

  test "record_new_version! rolls back on uniqueness conflict" do
    proposal = @delib.proposals.create!(content: "<p>Initial</p>", author: @member)
    Strategy::ProposalVersion.create!(proposal: proposal, version: 2, content: "<p>Conflict</p>")

    assert_raises(ActiveRecord::RecordNotUnique) { proposal.record_new_version!("<p>New</p>") }

    proposal.reload
    assert_equal 1, proposal.version
    assert_equal "<p>Initial</p>", proposal.content
  end
end
