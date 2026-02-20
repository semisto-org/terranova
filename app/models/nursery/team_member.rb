module Nursery
  class TeamMember < ApplicationRecord
    self.table_name = 'nursery_team_members'

    ROLES = %w[manager employee intern volunteer].freeze

    belongs_to :nursery, class_name: 'Nursery::Nursery'
    has_many :schedule_slots, class_name: 'Nursery::ScheduleSlot', foreign_key: :member_id, dependent: :destroy
    has_many :timesheet_entries, class_name: 'Nursery::TimesheetEntry', foreign_key: :member_id, dependent: :destroy

    validates :name, :email, :role, :start_date, presence: true
    validates :role, inclusion: { in: ROLES }
  end
end
