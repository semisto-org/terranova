# frozen_string_literal: true

require "test_helper"

class KnowledgeTopicTest < ActiveSupport::TestCase
  def valid_attrs
    { title: "Test Topic", content: "Some content about agroforestry practices", status: "draft" }
  end

  test "valid topic" do
    topic = KnowledgeTopic.new(valid_attrs)
    assert topic.valid?
  end

  test "requires title" do
    topic = KnowledgeTopic.new(valid_attrs.merge(title: nil))
    assert_not topic.valid?
    assert_includes topic.errors[:title], "can't be blank"
  end

  test "requires content" do
    topic = KnowledgeTopic.new(valid_attrs.merge(content: nil))
    assert_not topic.valid?
  end

  test "validates status inclusion" do
    topic = KnowledgeTopic.new(valid_attrs.merge(status: "invalid"))
    assert_not topic.valid?
  end

  test "computes reading time before save" do
    topic = KnowledgeTopic.create!(valid_attrs.merge(content: (["word"] * 500).join(" ")))
    assert_equal 3, topic.reading_time_minutes
  end

  test "reading time minimum is 1" do
    topic = KnowledgeTopic.create!(valid_attrs.merge(content: "short"))
    assert_equal 1, topic.reading_time_minutes
  end

  test "scopes by section" do
    section = KnowledgeSection.create!(name: "Test Section")
    KnowledgeTopic.create!(valid_attrs.merge(section: section))
    KnowledgeTopic.create!(valid_attrs.merge(title: "Other"))
    assert_equal 1, KnowledgeTopic.by_section(section.id).count
  end

  test "search scope" do
    KnowledgeTopic.create!(valid_attrs.merge(title: "PAC Regulations"))
    KnowledgeTopic.create!(valid_attrs.merge(title: "Other thing"))
    assert_equal 1, KnowledgeTopic.search("PAC").count
  end

  test "published scope" do
    KnowledgeTopic.create!(valid_attrs.merge(status: "published"))
    KnowledgeTopic.create!(valid_attrs.merge(title: "Draft", status: "draft"))
    assert_equal 1, KnowledgeTopic.published.count
  end

  test "pinned scope" do
    KnowledgeTopic.create!(valid_attrs.merge(pinned: true))
    KnowledgeTopic.create!(valid_attrs.merge(title: "Not pinned", pinned: false))
    assert_equal 1, KnowledgeTopic.pinned.count
  end

  test "as_json_brief returns expected keys" do
    topic = KnowledgeTopic.create!(valid_attrs)
    json = topic.as_json_brief
    assert_includes json.keys, :id
    assert_includes json.keys, :title
    assert_includes json.keys, :readingTimeMinutes
    assert_not_includes json.keys, :content
  end

  test "as_json_full includes content" do
    topic = KnowledgeTopic.create!(valid_attrs)
    json = topic.as_json_full
    assert_includes json.keys, :content
  end

  test "belongs to section optionally" do
    topic = KnowledgeTopic.new(valid_attrs.merge(section_id: nil))
    assert topic.valid?
  end
end
