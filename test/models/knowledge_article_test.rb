# frozen_string_literal: true

require "test_helper"

class KnowledgeArticleTest < ActiveSupport::TestCase
  def valid_attrs
    { title: "Test Article", content: "Some content", category: "research", status: "draft" }
  end

  test "valid article" do
    article = KnowledgeArticle.new(valid_attrs)
    assert article.valid?
  end

  test "requires title" do
    article = KnowledgeArticle.new(valid_attrs.merge(title: nil))
    assert_not article.valid?
    assert_includes article.errors[:title], "can't be blank"
  end

  test "requires content" do
    article = KnowledgeArticle.new(valid_attrs.merge(content: nil))
    assert_not article.valid?
  end

  test "validates category inclusion" do
    article = KnowledgeArticle.new(valid_attrs.merge(category: "invalid"))
    assert_not article.valid?
  end

  test "validates status inclusion" do
    article = KnowledgeArticle.new(valid_attrs.merge(status: "invalid"))
    assert_not article.valid?
  end

  test "validates pole inclusion when present" do
    article = KnowledgeArticle.new(valid_attrs.merge(pole: "invalid"))
    assert_not article.valid?
  end

  test "allows nil pole" do
    article = KnowledgeArticle.new(valid_attrs.merge(pole: nil))
    assert article.valid?
  end

  test "allows blank pole" do
    article = KnowledgeArticle.new(valid_attrs.merge(pole: ""))
    assert article.valid?
  end

  test "scopes by category" do
    KnowledgeArticle.create!(valid_attrs.merge(category: "funding"))
    KnowledgeArticle.create!(valid_attrs.merge(title: "Other", category: "research"))
    assert_equal 1, KnowledgeArticle.by_category("funding").count
  end

  test "search scope" do
    KnowledgeArticle.create!(valid_attrs.merge(title: "PAC Regulations"))
    KnowledgeArticle.create!(valid_attrs.merge(title: "Other thing"))
    assert_equal 1, KnowledgeArticle.search("PAC").count
  end

  test "published scope" do
    KnowledgeArticle.create!(valid_attrs.merge(status: "published"))
    KnowledgeArticle.create!(valid_attrs.merge(title: "Draft", status: "draft"))
    assert_equal 1, KnowledgeArticle.published.count
  end

  test "pinned scope" do
    KnowledgeArticle.create!(valid_attrs.merge(pinned: true))
    KnowledgeArticle.create!(valid_attrs.merge(title: "Not pinned", pinned: false))
    assert_equal 1, KnowledgeArticle.pinned.count
  end

  test "as_json_brief returns expected keys" do
    article = KnowledgeArticle.create!(valid_attrs)
    json = article.as_json_brief
    assert_includes json.keys, :id
    assert_includes json.keys, :title
    assert_includes json.keys, :category
    assert_not_includes json.keys, :content
  end

  test "as_json_full includes content" do
    article = KnowledgeArticle.create!(valid_attrs)
    json = article.as_json_full
    assert_includes json.keys, :content
  end
end
