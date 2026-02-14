module Nursery
  class Nursery < ApplicationRecord
    self.table_name = 'nursery_nurseries'

    TYPES = %w[semisto partner].freeze
    INTEGRATIONS = %w[platform manual].freeze

    has_many :stock_batches, class_name: 'Nursery::StockBatch', foreign_key: :nursery_id, dependent: :destroy
    has_many :pickup_orders, class_name: 'Nursery::Order', foreign_key: :pickup_nursery_id, dependent: :restrict_with_error

    validates :name, :nursery_type, :integration, presence: true
    validates :nursery_type, inclusion: { in: TYPES }
    validates :integration, inclusion: { in: INTEGRATIONS }
  end
end
