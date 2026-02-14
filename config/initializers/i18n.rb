Rails.application.configure do
  config.i18n.default_locale = :fr
  config.i18n.available_locales = %i[fr en de nl es it]
  config.i18n.fallbacks = [:fr, :en]
end
