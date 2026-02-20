# frozen_string_literal: true

require "test_helper"

class KnowledgeApiTest < ActionDispatch::IntegrationTest
  setup do
    @article = KnowledgeArticle.create!(
      title: "Test Article",
      content: "Test content here",
      summary: "A summary",
      category: "research",
      tags: ["test", "api"],
      status: "published",
      author_name: "Tester"
    )
  end

  test "GET /api/v1/knowledge returns articles" do
    get "/api/v1/knowledge", params: { status: "published" }
    assert_response :success
    data = JSON.parse(response.body)
    assert data["articles"].is_a?(Array)
    assert data["articles"].any? { |a| a["title"] == "Test Article" }
  end

  test "GET /api/v1/knowledge filters by category" do
    KnowledgeArticle.create!(title: "Funding", content: "x", category: "funding", status: "published")
    get "/api/v1/knowledge", params: { category: "funding", status: "published" }
    assert_response :success
    data = JSON.parse(response.body)
    assert data["articles"].all? { |a| a["category"] == "funding" }
  end

  test "GET /api/v1/knowledge filters by search" do
    get "/api/v1/knowledge", params: { search: "Test Article" }
    assert_response :success
    data = JSON.parse(response.body)
    assert data["articles"].any? { |a| a["title"] == "Test Article" }
  end

  test "GET /api/v1/knowledge/:id returns article with content" do
    get "/api/v1/knowledge/#{@article.id}"
    assert_response :success
    data = JSON.parse(response.body)
    assert_equal "Test Article", data["article"]["title"]
    assert_equal "Test content here", data["article"]["content"]
  end

  test "POST /api/v1/knowledge creates article" do
    assert_difference "KnowledgeArticle.count", 1 do
      post "/api/v1/knowledge", params: {
        title: "New Article",
        content: "New content",
        category: "funding",
        status: "draft",
        tags: ["new"]
      }, as: :json
    end
    assert_response :created
    data = JSON.parse(response.body)
    assert_equal "New Article", data["article"]["title"]
  end

  test "PATCH /api/v1/knowledge/:id updates article" do
    patch "/api/v1/knowledge/#{@article.id}", params: {
      title: "Updated Title"
    }, as: :json
    assert_response :success
    data = JSON.parse(response.body)
    assert_equal "Updated Title", data["article"]["title"]
  end

  test "DELETE /api/v1/knowledge/:id destroys article" do
    assert_difference "KnowledgeArticle.count", -1 do
      delete "/api/v1/knowledge/#{@article.id}"
    end
    assert_response :no_content
  end

  test "PATCH /api/v1/knowledge/:id/pin pins article" do
    patch "/api/v1/knowledge/#{@article.id}/pin"
    assert_response :success
    data = JSON.parse(response.body)
    assert data["article"]["pinned"]
  end

  test "PATCH /api/v1/knowledge/:id/unpin unpins article" do
    @article.update!(pinned: true)
    patch "/api/v1/knowledge/#{@article.id}/unpin"
    assert_response :success
    data = JSON.parse(response.body)
    assert_not data["article"]["pinned"]
  end

  test "POST /api/v1/knowledge with invalid data returns errors" do
    post "/api/v1/knowledge", params: { title: "", content: "" }, as: :json
    assert_response :unprocessable_entity
    data = JSON.parse(response.body)
    assert data["errors"].any?
  end
end
