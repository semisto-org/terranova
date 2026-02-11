class Event < ApplicationRecord
  belongs_to :cycle, optional: true
  has_many :event_attendees, dependent: :destroy
  has_many :attendees, through: :event_attendees, source: :member

  TYPES = %w[project_meeting stakeholder_meeting design_day guild_meeting betting semisto_day semos_fest training].freeze

  validates :title, :event_type, :start_date, :end_date, presence: true
  validates :event_type, inclusion: { in: TYPES }
end
