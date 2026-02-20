class EventType < ApplicationRecord
  include SoftDeletable
  has_many :events, dependent: :restrict_with_error

  validates :label, presence: true, uniqueness: true

  scope :ordered, -> { order(label: :asc) }
  scope :active, -> { all } # Pour l'instant tous sont actifs, peut être étendu plus tard
end
