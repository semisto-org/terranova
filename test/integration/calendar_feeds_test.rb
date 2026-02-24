require "test_helper"

class CalendarFeedsTest < ActionDispatch::IntegrationTest
  setup do
    @event_type = EventType.create!(label: "Semisto day")
    Event.create!(
      title: "Réunion équipe",
      event_type: @event_type,
      start_date: Time.zone.parse("2026-03-10 09:00"),
      end_date: Time.zone.parse("2026-03-10 12:00"),
      description: "Point hebdo",
      location: "Namur"
    )

    training_type = Academy::TrainingType.create!(name: "Permaculture")
    training = Academy::Training.create!(training_type: training_type, title: "Formation Design", status: "published")
    training.sessions.create!(start_date: Date.new(2026, 3, 20), end_date: Date.new(2026, 3, 22), description: "Immersion")
  end

  test "GET /calendar/semisto.ics returns ICS feed" do
    get "/calendar/semisto.ics"
    assert_response :success
    assert_equal "text/calendar; charset=utf-8", response.media_type + "; charset=utf-8"
    assert_includes response.body, "UID:semisto-event-"
    assert_includes response.body, "SUMMARY:Semisto day · Réunion équipe"
  end

  test "GET /calendar/trainings.ics returns ICS feed" do
    get "/calendar/trainings.ics"
    assert_response :success
    assert_includes response.body, "UID:training-session-"
    assert_includes response.body, "SUMMARY:Formation Design"
    assert_includes response.body, "DTSTART;VALUE=DATE:20260320"
  end

  test "signed token can be generated and used" do
    token = CalendarFeedToken.issue(feed: "trainings")
    assert CalendarFeedToken.valid_for_feed?(token, feed: "trainings")
    refute CalendarFeedToken.valid_for_feed?(token, feed: "semisto")
  end
end
