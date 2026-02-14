module Nursery
  class OrderLine < ApplicationRecord
    self.table_name = 'nursery_order_lines'

    belongs_to :order, class_name: 'Nursery::Order'
    belongs_to :stock_batch, class_name: 'Nursery::StockBatch'
    belongs_to :nursery, class_name: 'Nursery::Nursery'

    validates :species_name, :container_name, presence: true
  end
end
