module Nursery
  class TimesheetEntry < ApplicationRecord
    self.table_name = 'nursery_timesheet_entries'

    CATEGORIES = %w[
      propagation potting watering maintenance harvesting
      order-preparation transfer documentation training admin other
    ].freeze

    belongs_to :member, class_name: 'Nursery::TeamMember'
    belongs_to :nursery, class_name: 'Nursery::Nursery'

    validates :date, :category, :hours, presence: true
    validates :category, inclusion: { in: CATEGORIES }
    validates :hours, numericality: { greater_than: 0 }
  end
end
