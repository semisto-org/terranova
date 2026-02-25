module Academy
  class SchoolHolidaysFetcher
    CACHE_KEY = "academy:school_holidays:wallonia:v1"
    CACHE_TTL = 24.hours

    def fetch
      Rails.cache.fetch(CACHE_KEY, expires_in: CACHE_TTL) do
        {
          events: [],
          source: "wallonia-public-holidays",
          region: "Wallonie-Bruxelles",
          syncedAt: Time.current.iso8601
        }
      end
    rescue StandardError
      {
        events: [],
        source: "wallonia-public-holidays",
        region: "Wallonie-Bruxelles",
        syncedAt: Time.current.iso8601
      }
    end
  end
end
