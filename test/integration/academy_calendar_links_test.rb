require "test_helper"

class AcademyCalendarLinksTest < ActionDispatch::IntegrationTest
  test "returns signed calendar links for google agenda" do
    get "/api/v1/academy/calendar-links", as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert body.dig("semisto", "url").include?("/calendar/semisto.ics?token=")
    assert body.dig("trainings", "url").include?("/calendar/trainings.ics?token=")
    assert_equal 2, body["instructions"].size
  end
end
