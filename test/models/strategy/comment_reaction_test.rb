require "test_helper"

class Strategy::CommentReactionTest < ActiveSupport::TestCase
  setup do
    Strategy::CommentReaction.delete_all
    Strategy::DeliberationComment.delete_all
    Strategy::Deliberation.delete_all
    @member = Member.first || Member.create!(
      first_name: "Test", last_name: "User", email: "test-cr@semisto.org",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
    @delib = Strategy::Deliberation.create!(title: "Sujet", status: "open", created_by_id: @member.id)
    @comment = @delib.comments.create!(content: "<p>Hi</p>", author: @member)
  end

  test "valid emoji saves" do
    r = Strategy::CommentReaction.new(comment: @comment, member: @member, emoji: "thumbs_up")
    assert r.valid?, r.errors.full_messages.to_s
  end

  test "invalid emoji rejected" do
    r = Strategy::CommentReaction.new(comment: @comment, member: @member, emoji: "rocket")
    assert_not r.valid?
  end

  test "same member cannot react twice with same emoji on same comment" do
    Strategy::CommentReaction.create!(comment: @comment, member: @member, emoji: "heart")
    dup = Strategy::CommentReaction.new(comment: @comment, member: @member, emoji: "heart")
    assert_not dup.valid?
  end

  test "same member can react with different emojis on same comment" do
    Strategy::CommentReaction.create!(comment: @comment, member: @member, emoji: "heart")
    other = Strategy::CommentReaction.new(comment: @comment, member: @member, emoji: "bulb")
    assert other.valid?
  end
end
