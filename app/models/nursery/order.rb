module Nursery
  class Order < ApplicationRecord
    self.table_name = 'nursery_orders'

    STATUSES = %w[new processing ready picked-up cancelled].freeze
    PRICE_LEVELS = %w[solidarity standard support].freeze

    belongs_to :pickup_nursery, class_name: 'Nursery::Nursery'
    has_many :lines, class_name: 'Nursery::OrderLine', foreign_key: :order_id, dependent: :destroy
    has_many :transfers, class_name: 'Nursery::Transfer', foreign_key: :order_id, dependent: :destroy

    validates :order_number, :customer_name, :status, :price_level, presence: true
    validates :status, inclusion: { in: STATUSES }
    validates :price_level, inclusion: { in: PRICE_LEVELS }
  end
end
