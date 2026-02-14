Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("WEBSITE_ORIGIN", "http://localhost:4321")

    resource "/api/*",
      headers: :any,
      methods: %i[get options head]
  end
end
