require "test_helper"

class CalendarIcsServiceTest < ActiveSupport::TestCase
  test "generates valid ICS with timezone and stable uid" do
    ics = CalendarIcsService.new(
      feed_name: "Formations",
      events: [
        {
          uid: "training-session-42@terranova",
          title: "Formation Permaculture",
          description: "Jour 1",
          location: "Liège",
          start_at: Date.new(2026, 3, 20),
          end_at: Date.new(2026, 3, 21),
          all_day: true,
          updated_at: Time.utc(2026, 1, 1, 10, 0, 0)
        }
      ]
    ).call

    assert_includes ics, "BEGIN:VCALENDAR"
    assert_includes ics, "X-WR-TIMEZONE:Europe/Brussels"
    assert_includes ics, "UID:training-session-42@terranova"
    assert_includes ics, "SUMMARY:Formation Permaculture"
    assert_includes ics, "LOCATION:Liège"
    assert_includes ics, "END:VCALENDAR"
  end
end
