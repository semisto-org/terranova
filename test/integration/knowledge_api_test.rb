# frozen_string_literal: true

require "test_helper"

class KnowledgeApiTest < ActionDispatch::IntegrationTest
  setup do
    @section = KnowledgeSection.create!(name: "Réglementation", position: 1)
    @topic = KnowledgeTopic.create!(
      title: "Test Topic",
      content: "Test content here with enough words to matter",
      tags: ["test", "api"],
      status: "published",
      author_name: "Tester",
      section: @section
    )
  end

  # ─── Topics CRUD ───

  test "GET /api/v1/knowledge/topics returns topics" do
    get "/api/v1/knowledge/topics", params: { status: "published" }
    assert_response :success
    data = JSON.parse(response.body)
    assert data["topics"].is_a?(Array)
    assert data["topics"].any? { |t| t["title"] == "Test Topic" }
    assert data["topics"].first.key?("readingTimeMinutes")
    assert data["topics"].first.key?("sectionName")
  end

  test "GET /api/v1/knowledge/topics filters by section" do
    get "/api/v1/knowledge/topics", params: { section_id: @section.id, status: "published" }
    assert_response :success
    data = JSON.parse(response.body)
    assert data["topics"].all? { |t| t["sectionId"] == @section.id }
  end

  test "GET /api/v1/knowledge/topics filters by search" do
    get "/api/v1/knowledge/topics", params: { search: "Test Topic" }
    assert_response :success
    data = JSON.parse(response.body)
    assert data["topics"].any? { |t| t["title"] == "Test Topic" }
  end

  test "GET /api/v1/knowledge/topics/:id returns topic with content" do
    get "/api/v1/knowledge/topics/#{@topic.id}"
    assert_response :success
    data = JSON.parse(response.body)
    assert_equal "Test Topic", data["topic"]["title"]
    assert_equal "Test content here with enough words to matter", data["topic"]["content"]
    assert data["topic"].key?("attachments")
  end

  test "POST /api/v1/knowledge/topics creates topic" do
    assert_difference "KnowledgeTopic.count", 1 do
      post "/api/v1/knowledge/topics", params: {
        title: "New Topic",
        content: "New content here",
        status: "draft",
        section_id: @section.id,
        tags: ["new"]
      }, as: :json
    end
    assert_response :created
    data = JSON.parse(response.body)
    assert_equal "New Topic", data["topic"]["title"]
    assert data["topic"]["readingTimeMinutes"] >= 1
  end

  test "PATCH /api/v1/knowledge/topics/:id updates topic" do
    patch "/api/v1/knowledge/topics/#{@topic.id}", params: {
      title: "Updated Title"
    }, as: :json
    assert_response :success
    data = JSON.parse(response.body)
    assert_equal "Updated Title", data["topic"]["title"]
  end

  test "PATCH creates a revision on update" do
    assert_difference "KnowledgeTopicRevision.count", 1 do
      patch "/api/v1/knowledge/topics/#{@topic.id}", params: {
        title: "Revised Title"
      }, as: :json
    end
    assert_response :success
  end

  test "DELETE /api/v1/knowledge/topics/:id destroys topic" do
    assert_difference "KnowledgeTopic.count", -1 do
      delete "/api/v1/knowledge/topics/#{@topic.id}"
    end
    assert_response :no_content
  end

  test "PATCH pin/unpin" do
    patch "/api/v1/knowledge/topics/#{@topic.id}/pin"
    assert_response :success
    assert JSON.parse(response.body)["topic"]["pinned"]

    patch "/api/v1/knowledge/topics/#{@topic.id}/unpin"
    assert_response :success
    assert_not JSON.parse(response.body)["topic"]["pinned"]
  end

  test "POST with invalid data returns errors" do
    post "/api/v1/knowledge/topics", params: { title: "", content: "" }, as: :json
    assert_response :unprocessable_entity
    data = JSON.parse(response.body)
    assert data["errors"].any?
  end

  # ─── Sections CRUD ───

  test "GET /api/v1/knowledge/sections returns sections" do
    get "/api/v1/knowledge/sections"
    assert_response :success
    data = JSON.parse(response.body)
    assert data["sections"].is_a?(Array)
    assert data["sections"].any? { |s| s["name"] == "Réglementation" }
  end

  test "POST /api/v1/knowledge/sections creates section" do
    assert_difference "KnowledgeSection.count", 1 do
      post "/api/v1/knowledge/sections", params: {
        name: "Financement",
        description: "Articles sur le financement",
        position: 2
      }, as: :json
    end
    assert_response :created
  end

  test "PATCH /api/v1/knowledge/sections/:id updates section" do
    patch "/api/v1/knowledge/sections/#{@section.id}", params: { name: "Renamed" }, as: :json
    assert_response :success
    assert_equal "Renamed", JSON.parse(response.body)["section"]["name"]
  end

  test "DELETE /api/v1/knowledge/sections/:id destroys section" do
    section = KnowledgeSection.create!(name: "To Delete")
    assert_difference "KnowledgeSection.count", -1 do
      delete "/api/v1/knowledge/sections/#{section.id}"
    end
    assert_response :no_content
  end

  # ─── Comments ───

  test "GET /api/v1/knowledge/topics/:id/comments returns comments" do
    @topic.comments.create!(content: "Nice article!", author_name: "Bob")
    get "/api/v1/knowledge/topics/#{@topic.id}/comments"
    assert_response :success
    data = JSON.parse(response.body)
    assert_equal 1, data["comments"].size
    assert_equal "Nice article!", data["comments"].first["content"]
  end

  test "POST /api/v1/knowledge/topics/:id/comments creates comment" do
    assert_difference "KnowledgeComment.count", 1 do
      post "/api/v1/knowledge/topics/#{@topic.id}/comments", params: {
        content: "Great topic!"
      }, as: :json
    end
    assert_response :created
  end

  test "DELETE comment" do
    comment = @topic.comments.create!(content: "Delete me", author_name: "X")
    assert_difference "KnowledgeComment.count", -1 do
      delete "/api/v1/knowledge/topics/#{@topic.id}/comments/#{comment.id}"
    end
    assert_response :no_content
  end

  # ─── Revisions ───

  test "GET /api/v1/knowledge/topics/:id/revisions" do
    @topic.revisions.create!(user_name: "Test", changes_data: { "title" => "old" })
    get "/api/v1/knowledge/topics/#{@topic.id}/revisions"
    assert_response :success
    data = JSON.parse(response.body)
    assert_equal 1, data["revisions"].size
  end

  # ─── Related ───

  test "GET /api/v1/knowledge/topics/:id/related" do
    KnowledgeTopic.create!(title: "Related", content: "x", tags: ["test"], status: "published")
    get "/api/v1/knowledge/topics/#{@topic.id}/related"
    assert_response :success
    data = JSON.parse(response.body)
    assert data["topics"].is_a?(Array)
  end

  # ─── Search ───

  test "GET /api/v1/knowledge/search?q= returns results" do
    get "/api/v1/knowledge/search", params: { q: "Test" }
    assert_response :success
    data = JSON.parse(response.body)
    assert data["topics"].any? { |t| t["title"] == "Test Topic" }
  end

  test "GET /api/v1/knowledge/search with blank q returns empty" do
    get "/api/v1/knowledge/search", params: { q: "" }
    assert_response :success
    assert_equal [], JSON.parse(response.body)["topics"]
  end
end
