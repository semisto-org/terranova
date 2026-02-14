module Nursery
  class Container < ApplicationRecord
    self.table_name = 'nursery_containers'

    has_many :stock_batches, class_name: 'Nursery::StockBatch', foreign_key: :container_id, dependent: :restrict_with_error

    validates :name, :short_name, presence: true
  end
end
