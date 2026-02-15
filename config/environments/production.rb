require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true

  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  config.require_master_key = false

  config.public_file_server.enabled = ENV["RAILS_SERVE_STATIC_FILES"].present?
  config.active_storage.service = :local

  config.force_ssl = false
  config.log_level = :info
  config.log_tags = [:request_id]

  config.action_mailer.perform_caching = false
  config.action_mailer.delivery_method = :ses_v2
  config.action_mailer.ses_v2_settings = {
    region:      ENV.fetch("AWS_SES_REGION", "eu-west-1"),
    credentials: Aws::Credentials.new(
      ENV.fetch("AWS_SES_ACCESS_KEY_ID"),
      ENV.fetch("AWS_SES_SECRET_ACCESS_KEY")
    )
  }
  config.action_mailer.default_url_options = { host: ENV.fetch("APP_HOST", "terranova.semisto.org") }
  config.action_mailer.raise_delivery_errors = true

  config.i18n.fallbacks = true
  config.active_support.report_deprecations = false
end
