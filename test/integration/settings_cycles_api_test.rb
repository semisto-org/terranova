require "test_helper"

class SettingsCyclesApiTest < ActionDispatch::IntegrationTest
  test "CRUD settings cycles" do
    get "/api/v1/settings/cycles", as: :json
    assert_response :success

    post "/api/v1/settings/cycles", params: {
      name: "Cycle printemps",
      starts_on: "2026-03-01",
      ends_on: "2026-03-14",
      cooldown_starts_on: "2026-03-15",
      cooldown_ends_on: "2026-03-21",
      color: "#22AA66",
      notes: "Phase test",
      active: true
    }, as: :json

    assert_response :created
    created = JSON.parse(response.body)
    assert_equal "Cycle printemps", created["name"]

    cycle_id = created["id"]

    patch "/api/v1/settings/cycles/#{cycle_id}", params: {
      notes: "Phase test modifiée",
      active: false
    }, as: :json

    assert_response :success
    updated = JSON.parse(response.body)
    assert_equal false, updated["active"]
    assert_equal "Phase test modifiée", updated["notes"]

    delete "/api/v1/settings/cycles/#{cycle_id}", as: :json
    assert_response :no_content
  end

  test "lab calendar includes cycle period events payload" do
    CyclePeriod.create!(
      name: "Cycle été",
      starts_on: Date.new(2026, 7, 1),
      ends_on: Date.new(2026, 7, 14),
      cooldown_starts_on: Date.new(2026, 7, 15),
      cooldown_ends_on: Date.new(2026, 7, 21),
      color: "#FF8800",
      active: true
    )

    get "/api/v1/lab/calendar", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body.key?("cyclePeriods")
    assert body.key?("cycleEvents")

    work_event = body["cycleEvents"].find { |event| event["type"] == "cycle_work" }
    cooldown_event = body["cycleEvents"].find { |event| event["type"] == "cycle_cooldown" }

    assert_not_nil work_event
    assert_not_nil cooldown_event
    assert_equal "#FF8800", work_event["color"]
  end
end
