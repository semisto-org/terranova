ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
require 'rails/test_help'
require 'mocha/minitest'

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
