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
          start_date: Date.new(2026, 3, 20),
          end_date: Date.new(2026, 3, 21),
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

  # Garde-fou de l'adaptateur de champs (#143) : le service lit start_date/end_date
  # (noms du modèle Event), pas start_at/end_at. Les dates doivent être NON vides.
  test "reads start_date/end_date for an all-day event" do
    ics = CalendarIcsService.new(
      feed_name: "Mon agenda",
      events: [
        {
          uid: "member-event-1@terranova",
          title: "Réunion",
          description: nil,
          location: nil,
          start_date: Date.new(2026, 5, 4),
          end_date: Date.new(2026, 5, 4),
          all_day: true,
          updated_at: Time.utc(2026, 1, 1, 10, 0, 0)
        }
      ]
    ).call

    assert_includes ics, "DTSTART;VALUE=DATE:20260504"
    # end_date exclusif => jour suivant
    assert_includes ics, "DTEND;VALUE=DATE:20260505"
  end

  test "reads start_date/end_date for a timed event" do
    ics = CalendarIcsService.new(
      feed_name: "Mon agenda",
      events: [
        {
          uid: "member-event-2@terranova",
          title: "Atelier",
          description: nil,
          location: nil,
          start_date: Time.zone.parse("2026-05-04 09:00"),
          end_date: Time.zone.parse("2026-05-04 12:00"),
          all_day: false,
          updated_at: Time.utc(2026, 1, 1, 10, 0, 0)
        }
      ]
    ).call

    assert_includes ics, "DTSTART;TZID=Europe/Brussels:20260504T090000"
    assert_includes ics, "DTEND;TZID=Europe/Brussels:20260504T120000"
  end
end
