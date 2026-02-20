module Nursery
  class StockBatch < ApplicationRecord
    include SoftDeletable
    self.table_name = 'nursery_stock_batches'

    GROWTH_STAGES = %w[seed seedling young established mature].freeze

    belongs_to :nursery, class_name: 'Nursery::Nursery'
    belongs_to :container, class_name: 'Nursery::Container'
    has_many :order_lines, class_name: 'Nursery::OrderLine', foreign_key: :stock_batch_id, dependent: :restrict_with_error

    validates :species_id, :species_name, :growth_stage, presence: true
    validates :growth_stage, inclusion: { in: GROWTH_STAGES }
  end
end
