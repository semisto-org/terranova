module Nursery
  class Nursery < ApplicationRecord
    self.table_name = 'nursery_nurseries'

    TYPES = %w[semisto partner].freeze
    INTEGRATIONS = %w[platform manual].freeze

    has_many :stock_batches, class_name: 'Nursery::StockBatch', foreign_key: :nursery_id, dependent: :destroy
    has_many :pickup_orders, class_name: 'Nursery::Order', foreign_key: :pickup_nursery_id, dependent: :restrict_with_error
    has_many :team_members, class_name: 'Nursery::TeamMember', foreign_key: :nursery_id, dependent: :destroy
    has_many :schedule_slots, class_name: 'Nursery::ScheduleSlot', foreign_key: :nursery_id, dependent: :destroy
    has_many :documentation_entries, class_name: 'Nursery::DocumentationEntry', foreign_key: :nursery_id, dependent: :nullify
    has_many :timesheet_entries, class_name: 'Nursery::TimesheetEntry', foreign_key: :nursery_id, dependent: :destroy

    validates :name, :nursery_type, :integration, presence: true
    validates :nursery_type, inclusion: { in: TYPES }
    validates :integration, inclusion: { in: INTEGRATIONS }
  end
end
