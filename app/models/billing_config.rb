# frozen_string_literal: true

class BillingConfig < ApplicationRecord
  self.table_name = "billing_config"

  validates :hourly_rate, numericality: { greater_than: 0 }
  validates :asbl_support_rate, numericality: { greater_than_or_equal_to: 0, less_than: 1 }

  def self.instance
    first || create!(hourly_rate: 60.0, asbl_support_rate: 0.15)
  end
end
