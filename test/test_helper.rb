ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
require 'rails/test_help'
require 'mocha/minitest'

# OpenAPI generation: only active when OPENAPI=1, so normal test runs are untouched.
# `rspec-openapi` records real request/response pairs from the integration tests and
# writes a spec to doc/openapi.yaml. See lib/tasks/openapi.rake for the domain split.
if ENV['OPENAPI']
  require 'rspec/openapi'
  RSpec::OpenAPI.title = 'Terranova API'
  RSpec::OpenAPI.path = 'doc/openapi.yaml'
  RSpec::OpenAPI.application_version = '1.0.0'
  RSpec::OpenAPI.servers = [{ url: 'https://terranova.semisto.org' }]
  # Examples are recorded from live test responses (volatile IDs/timestamps), which
  # would make the spec non-deterministic and break CI drift detection. The inferred
  # schema is the contract and stays stable, so we keep schemas and drop examples.
  RSpec::OpenAPI.enable_example = false

  # rspec-openapi stores the opt-in flag in a per-class instance variable that does
  # not inherit, so enabling it on a base class would not reach subclasses. Make the
  # check walk the ancestor chain so a single opt-in on ActionDispatch::IntegrationTest
  # covers every integration test.
  module RSpec::OpenAPI::Minitest::ActivateOpenApiClassMethods::ClassMethods
    def openapi?
      return @openapi unless @openapi.nil?

      superclass.respond_to?(:openapi?) ? superclass.openapi? : false
    end
  end

  ActionDispatch::IntegrationTest.openapi!

  # Deterministic test order for the recording run. rspec-openapi infers and MERGES
  # response schemas in execution order; Rails' default random order (a fresh seed
  # every run) makes the recorded spec drift run-to-run and machine-to-machine, which
  # is exactly what breaks the CI drift gate. Sorting by name makes the recording
  # reproducible. Only applied under OPENAPI=1 so normal runs keep random order
  # (which still catches order-dependent test bugs).
  ActiveSupport::TestCase.test_order = :sorted
end

# Configure deterministic ActiveRecord encryption keys for the test environment.
ActiveRecord::Encryption.configure(
  primary_key: 'test_primary_key_32_bytes_minimum_xx',
  deterministic_key: 'test_deterministic_key_32_bytes_xx',
  key_derivation_salt: 'test_key_derivation_salt_32_bytes_x'
)

class ActiveSupport::TestCase
  parallelize(workers: 1)

  # Ensure a default Organization exists for tests that touch Expense/Revenue/BankConnection
  # (they require organization presence and rely on Organization.default).
  setup do
    Organization.find_or_create_by!(name: 'Test Organization') do |o|
      o.is_default = true
    end
  end
end
