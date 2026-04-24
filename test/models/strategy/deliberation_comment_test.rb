require "test_helper"

class Strategy::DeliberationCommentTest < ActiveSupport::TestCase
  setup do
    Strategy::CommentReaction.delete_all
    Strategy::DeliberationComment.delete_all
    Strategy::Deliberation.delete_all
    @member = Member.first || Member.create!(
      first_name: "Test", last_name: "User", email: "test-dc@semisto.org",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
    @delib = Strategy::Deliberation.create!(title: "Sujet", status: "open", created_by_id: @member.id)
  end

  test "root comment saves with null parent_id" do
    c = @delib.comments.create!(content: "<p>Hello</p>", author: @member)
    assert_nil c.parent_id
  end

  test "reply with valid root parent saves" do
    root = @delib.comments.create!(content: "<p>Root</p>", author: @member)
    reply = @delib.comments.create!(content: "<p>Reply</p>", author: @member, parent: root)
    assert_equal root.id, reply.parent_id
  end

  test "reply to a reply is rejected (max 2 levels)" do
    root = @delib.comments.create!(content: "<p>Root</p>", author: @member)
    reply = @delib.comments.create!(content: "<p>Reply</p>", author: @member, parent: root)
    third = @delib.comments.build(content: "<p>Nope</p>", author: @member, parent: reply)
    assert_not third.valid?
    assert_includes third.errors[:parent_id].join, "root"
  end

  test "reply parent from another deliberation is rejected" do
    other_delib = Strategy::Deliberation.create!(title: "Other", status: "open", created_by_id: @member.id)
    other_root = other_delib.comments.create!(content: "<p>Other root</p>", author: @member)
    foreign = @delib.comments.build(content: "<p>Cross</p>", author: @member, parent: other_root)
    assert_not foreign.valid?
    assert_includes foreign.errors[:parent_id].join, "same deliberation"
  end

  test "soft_delete! hard-deletes when no replies" do
    c = @delib.comments.create!(content: "<p>Alone</p>", author: @member)
    c.soft_delete!
    assert_not Strategy::DeliberationComment.exists?(c.id)
  end

  test "soft_delete! soft-deletes when replies exist" do
    root = @delib.comments.create!(content: "<p>Root</p>", author: @member)
    @delib.comments.create!(content: "<p>Reply</p>", author: @member, parent: root)
    root.soft_delete!
    root.reload
    assert root.deleted_at.present?
    assert root.deleted?
  end

  test "sanitizer strips script tags" do
    c = @delib.comments.create!(content: "<p>Hello</p><script>alert(1)</script>", author: @member)
    assert_not_includes c.content, "<script>"
    assert_includes c.content, "<p>Hello</p>"
  end

  test "sanitizer strips on-event handlers" do
    c = @delib.comments.create!(content: '<p onclick="alert(1)">Hi</p>', author: @member)
    assert_not_includes c.content, "onclick"
  end

  test "sanitizer keeps allowed formatting (bold, link)" do
    c = @delib.comments.create!(
      content: '<p><strong>Bold</strong> and <a href="https://example.com">link</a></p>',
      author: @member
    )
    assert_includes c.content, "<strong>"
    assert_includes c.content, 'href="https://example.com"'
  end

  test "as_json_brief includes reactions and reply metadata on root" do
    root = @delib.comments.create!(content: "<p>Root</p>", author: @member)
    @delib.comments.create!(content: "<p>Reply</p>", author: @member, parent: root)
    root.reactions.create!(member: @member, emoji: "thumbs_up")
    root.reload

    payload = root.as_json_brief(current_member: @member)
    assert_equal 1, payload[:replyCount]
    assert_equal 1, payload[:replyParticipants].size
    thumbs = payload[:reactions].find { |r| r[:emoji] == "thumbs_up" }
    assert_equal 1, thumbs[:count]
    assert_equal true, thumbs[:reactedByMe]
  end

  test "as_json_brief hides content for deleted comment" do
    root = @delib.comments.create!(content: "<p>Root</p>", author: @member)
    @delib.comments.create!(content: "<p>Reply</p>", author: @member, parent: root)
    root.soft_delete!
    payload = root.reload.as_json_brief
    assert_nil payload[:content]
    assert_equal true, payload[:isDeleted]
  end
end
