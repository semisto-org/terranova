class Event < ApplicationRecord
  include SoftDeletable
  include Subscribable
  belongs_to :cycle, optional: true
  belongs_to :event_type
  belongs_to :projectable, polymorphic: true, optional: true
  has_many :event_attendees, dependent: :destroy
  has_many :attendees, through: :event_attendees, source: :member
  # Tâches portées à l'ordre du jour de cette réunion (#37). Détacher (nullify)
  # plutôt que supprimer : la tâche survit à la disparition de la réunion.
  has_many :tasks, dependent: :nullify
  has_one :album, as: :albumable, dependent: :destroy
  has_many :comments, as: :commentable, dependent: :destroy
  has_many :activity_events, as: :subject, dependent: :destroy

  validates :title, :event_type, :start_date, :end_date, presence: true

  # Delegate for easy access to event type properties
  delegate :label, to: :event_type, prefix: false

end
