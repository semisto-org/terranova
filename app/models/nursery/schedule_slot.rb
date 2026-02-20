module Nursery
  class ScheduleSlot < ApplicationRecord
    self.table_name = 'nursery_schedule_slots'

    belongs_to :member, class_name: 'Nursery::TeamMember'
    belongs_to :nursery, class_name: 'Nursery::Nursery'

    validates :date, :start_time, :end_time, presence: true
  end
end
