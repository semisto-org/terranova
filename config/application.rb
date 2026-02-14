require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"
require "active_storage/engine"

Bundler.require(*Rails.groups)

module TerranovaApi
  class Application < Rails::Application
    config.load_defaults 8.1
    config.api_only = false

    config.generators do |g|
      g.system_tests = nil
      g.helper = false
      g.stylesheets = false
      g.javascripts = false
      g.request_specs = false
      g.test_framework :test_unit, fixture: false
    end
  end
end
