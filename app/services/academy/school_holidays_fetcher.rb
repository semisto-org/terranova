require "net/http"
require "json"

module Academy
  class SchoolHolidaysFetcher
    CACHE_KEY = "academy:school_holidays:wallonia:v1"
    CACHE_TTL = 24.hours
    API_BASE = "https://openholidaysapi.org/SchoolHolidays".freeze

    def fetch
      Rails.cache.fetch(CACHE_KEY, expires_in: CACHE_TTL) do
        from = Date.current.beginning_of_year
        to = (Date.current + 15.months).end_of_year

        uri = URI("#{API_BASE}?countryIsoCode=BE&languageIsoCode=FR&validFrom=#{from}&validTo=#{to}")
        response = Net::HTTP.get_response(uri)

        events = if response.is_a?(Net::HTTPSuccess)
                   parse_events(JSON.parse(response.body))
                 else
                   []
                 end

        {
          events: events,
          source: "openholidaysapi.org",
          region: "Wallonie-Bruxelles",
          syncedAt: Time.current.iso8601
        }
      end
    rescue StandardError
      {
        events: [],
        source: "openholidaysapi.org",
        region: "Wallonie-Bruxelles",
        syncedAt: Time.current.iso8601
      }
    end

    private

    def parse_events(rows)
      (rows || [])
        .select { |row| wallonia_federation?(row) }
        .map do |row|
          title = row.fetch("name", []).find { |entry| entry["language"] == "FR" }&.dig("text") || "Congé scolaire"
          {
            id: "school-holiday-#{row["id"]}",
            title: title,
            type: "school_holiday",
            color: "#7C3AED",
            startDate: row["startDate"],
            endDate: row["endDate"],
            allDay: true,
            readOnly: true,
            source: "school_holidays"
          }
        end
    end

    def wallonia_federation?(row)
      groups = row.fetch("groups", []).map { |g| g["code"] }
      groups.include?("BE-FR")
    end
  end
end
