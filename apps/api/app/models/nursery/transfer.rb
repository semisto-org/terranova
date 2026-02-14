module Nursery
  class Transfer < ApplicationRecord
    self.table_name = 'nursery_transfers'

    STATUSES = %w[planned in-progress completed cancelled].freeze

    belongs_to :order, class_name: 'Nursery::Order'

    validates :status, :scheduled_date, presence: true
    validates :status, inclusion: { in: STATUSES }
  end
end
