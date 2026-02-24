class CalendarFeedsController < ActionController::Base
  FEED_SEMISTO = "semisto".freeze
  FEED_TRAININGS = "trainings".freeze

  def semisto
    authorize_feed!(FEED_SEMISTO)
    render plain: CalendarIcsService.new(feed_name: "Semisto", events: semisto_events).call,
           content_type: "text/calendar; charset=utf-8"
  end

  def trainings
    authorize_feed!(FEED_TRAININGS)
    render plain: CalendarIcsService.new(feed_name: "Formations", events: training_events).call,
           content_type: "text/calendar; charset=utf-8"
  end

  private

  def authorize_feed!(feed)
    token = params[:token].to_s
    return if token.present? && CalendarFeedToken.valid_for_feed?(token, feed: feed)
    return unless ActiveModel::Type::Boolean.new.cast(ENV.fetch("CALENDAR_FEEDS_REQUIRE_TOKEN", false))

    head :unauthorized
  end

  def semisto_events
    Event.includes(:event_type).order(:start_date).map do |event|
      {
        uid: "semisto-event-#{event.id}@terranova",
        title: [event.label, event.title].compact_blank.join(" · "),
        description: event.description,
        location: event.location,
        start_at: event.start_date,
        end_at: event.end_date,
        all_day: event.all_day,
        updated_at: event.updated_at
      }
    end
  end

  def training_events
    locations = Academy::TrainingLocation.all.index_by { |l| l.id.to_s }

    Academy::Training.includes(:sessions).order(:updated_at).flat_map do |training|
      training.sessions.map do |session|
        location_names = Array(session.location_ids).map { |id| locations[id.to_s]&.name }.compact

        {
          uid: "training-session-#{session.id}@terranova",
          title: training.title,
          description: [training.description, session.description].compact_blank.join("\n\n"),
          location: location_names.join(", "),
          start_at: session.start_date,
          end_at: session.end_date,
          all_day: true,
          updated_at: [session.updated_at, training.updated_at].compact.max
        }
      end
    end
  end
end
