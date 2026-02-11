class EventAttendee < ApplicationRecord
  belongs_to :event
  belongs_to :member

  validates :member_id, uniqueness: { scope: :event_id }
end
