class CalendarIcsService
  TIMEZONE = "Europe/Brussels".freeze

  def initialize(feed_name:, events:)
    @feed_name = feed_name
    @events = events
  end

  def call
    lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Terranova//Calendar Export//FR",
      "CALSCALE:GREGORIAN",
      "X-WR-CALNAME:#{escape(@feed_name)}",
      "X-WR-TIMEZONE:#{TIMEZONE}"
    ]

    @events.each do |event|
      lines.concat(build_event_lines(event))
    end

    lines << "END:VCALENDAR"
    fold_lines(lines).join("\r\n") + "\r\n"
  end

  private

  def build_event_lines(event)
    lines = [
      "BEGIN:VEVENT",
      "UID:#{escape(event.fetch(:uid))}",
      "DTSTAMP:#{event.fetch(:updated_at).utc.strftime('%Y%m%dT%H%M%SZ')}",
      "SUMMARY:#{escape(event.fetch(:title))}"
    ]

    if event[:all_day]
      lines << "DTSTART;VALUE=DATE:#{event.fetch(:start_at).strftime('%Y%m%d')}"
      lines << "DTEND;VALUE=DATE:#{(event.fetch(:end_at).to_date + 1.day).strftime('%Y%m%d')}"
    else
      lines << "DTSTART;TZID=#{TIMEZONE}:#{event.fetch(:start_at).strftime('%Y%m%dT%H%M%S')}"
      lines << "DTEND;TZID=#{TIMEZONE}:#{event.fetch(:end_at).strftime('%Y%m%dT%H%M%S')}"
    end

    lines << "DESCRIPTION:#{escape(event[:description])}" if event[:description].present?
    lines << "LOCATION:#{escape(event[:location])}" if event[:location].present?
    lines << "END:VEVENT"
    lines
  end

  def escape(text)
    text.to_s.gsub("\\", "\\\\").gsub(";", "\\;").gsub(",", "\\,").gsub("\n", "\\n")
  end

  def fold_lines(lines)
    lines.flat_map do |line|
      next line if line.length <= 75

      chunks = line.scan(/.{1,75}/)
      [chunks.first, *chunks.drop(1).map { |chunk| " #{chunk}" }]
    end
  end
end
