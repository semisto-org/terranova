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
    training = Academy::Training.create!(training_type: training_type, title: "Formation Design", status: "registrations_open")
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

  # --- Flux iCal personnel par membre (#143) ---------------------------------

  def build_member
    Member.create!(
      first_name: "Mo", last_name: "H", email: "mo-#{SecureRandom.hex(4)}@test.be",
      status: "active", joined_at: Time.current, member_kind: "human", membership_type: "effective"
    )
  end

  test "GET /calendar/my/:token.ics returns the member's events and tasks with non-empty dates" do
    member = build_member

    # Event auquel le membre est inscrit (event_attendees).
    event = Event.create!(
      title: "Réunion perso", event_type: @event_type,
      start_date: Time.zone.parse("2026-04-01 10:00"),
      end_date: Time.zone.parse("2026-04-01 11:00"),
      location: "Yvoir"
    )
    event.event_attendees.create!(member: member)

    # Tâche assignée et datée du membre.
    project = PoleProject.create!(name: "Communication", pole: "academy")
    ProjectMembership.create!(projectable: project, member: member, role: "member")
    list = TaskList.create!(name: "À faire", taskable: project)
    list.tasks.create!(name: "Préparer le sol", status: "pending", assignee_id: member.id, due_date: Date.new(2026, 4, 5))

    token = CalendarFeedToken.issue_member(member)
    get "/calendar/my/#{token}.ics"

    assert_response :success
    assert_equal "text/calendar", response.media_type
    body = response.body

    # Event du membre, avec des dates NON vides (preuve adaptateur de champs OK).
    assert_includes body, "UID:member-event-#{event.id}@terranova"
    assert_includes body, "DTSTART;TZID=Europe/Brussels:20260401T100000"
    assert_includes body, "DTEND;TZID=Europe/Brussels:20260401T110000"

    # Échéance de tâche assignée.
    assert_includes body, "SUMMARY:À rendre : Préparer le sol"
    assert_includes body, "DTSTART;VALUE=DATE:20260405"

    # Aucune date vide ne doit traîner dans le flux.
    refute_match(/DTSTART[^:]*:\s*$/, body)
    refute_match(/DTEND[^:]*:\s*$/, body)
  end

  test "member feed excludes events and tasks of other members" do
    member = build_member
    other = build_member

    other_event = Event.create!(
      title: "Pas la mienne", event_type: @event_type,
      start_date: Time.zone.parse("2026-04-02 10:00"),
      end_date: Time.zone.parse("2026-04-02 11:00")
    )
    other_event.event_attendees.create!(member: other)

    token = CalendarFeedToken.issue_member(member)
    get "/calendar/my/#{token}.ics"

    assert_response :success
    refute_includes response.body, "UID:member-event-#{other_event.id}@terranova"
  end

  test "GET /calendar/my/:token.ics with an invalid token is unauthorized" do
    get "/calendar/my/not-a-valid-token.ics"
    assert_response :unauthorized
  end

  test "regenerating the calendar token revokes the old one" do
    member = build_member
    old_token = CalendarFeedToken.issue_member(member)

    get "/calendar/my/#{old_token}.ics"
    assert_response :success

    member.regenerate_calendar_token!

    get "/calendar/my/#{old_token}.ics"
    assert_response :unauthorized

    new_token = CalendarFeedToken.issue_member(member)
    get "/calendar/my/#{new_token}.ics"
    assert_response :success
  end

  test "GET /api/v1/profile/calendar-feed returns the member's signed feed url" do
    member = build_member
    Thread.current[:test_member] = member

    get "/api/v1/profile/calendar-feed", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_match %r{/calendar/my/.+\.ics\z}, body["url"]

    # L'URL renvoyée doit réellement servir le flux du membre.
    token = body["url"][%r{/calendar/my/(.+)\.ics\z}, 1]
    assert_equal member.id, CalendarFeedToken.member_from(token).id
  ensure
    Thread.current[:test_member] = nil
  end

  test "POST /api/v1/profile/calendar-feed/regenerate invalidates the previous url" do
    member = build_member
    Thread.current[:test_member] = member

    get "/api/v1/profile/calendar-feed", as: :json
    old_url = JSON.parse(response.body)["url"]
    old_token = old_url[%r{/calendar/my/(.+)\.ics\z}, 1]

    post "/api/v1/profile/calendar-feed/regenerate", as: :json
    assert_response :success
    new_url = JSON.parse(response.body)["url"]

    refute_equal old_url, new_url
    assert_nil CalendarFeedToken.member_from(old_token)
  ensure
    Thread.current[:test_member] = nil
  end
end
