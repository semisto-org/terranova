class Event < ApplicationRecord
  belongs_to :cycle, optional: true
  belongs_to :event_type
  has_many :event_attendees, dependent: :destroy
  has_many :attendees, through: :event_attendees, source: :member

  validates :title, :event_type, :start_date, :end_date, presence: true

  # Delegate for easy access to event type properties
  delegate :label, to: :event_type, prefix: false
end
