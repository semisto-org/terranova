# frozen_string_literal: true

require "test_helper"

class OpenapiSpecTest < ActionDispatch::IntegrationTest
  test "GET /api/v1/openapi returns the spec index" do
    get "/api/v1/openapi"
    assert_response :success
    data = JSON.parse(response.body)
    assert data["domains"].is_a?(Array)
    assert data["domains"].any? { |d| d["name"] == "knowledge" }
    assert data["totalEndpoints"].positive?
  end

  test "GET /api/v1/openapi/:domain returns a domain slice" do
    get "/api/v1/openapi/knowledge"
    assert_response :success
    data = JSON.parse(response.body)
    assert_equal "3.0.3", data["openapi"]
    assert data["paths"].keys.any? { |p| p.start_with?("/api/v1/knowledge") }
  end

  test "unknown domain returns 404" do
    get "/api/v1/openapi/does_not_exist"
    assert_response :not_found
  end

  test "invalid domain name is rejected at the routing layer" do
    assert_raises(ActionController::RoutingError) do
      get "/api/v1/openapi/..%2Fsecrets"
    end
  end
end
