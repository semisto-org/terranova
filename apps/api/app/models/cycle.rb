class Cycle < ApplicationRecord
  has_many :bets, dependent: :destroy
  has_many :events, dependent: :nullify

  enum :status, {
    upcoming: "upcoming",
    active: "active",
    cooldown: "cooldown",
    completed: "completed"
  }, validate: true

  validates :name, :start_date, :end_date, :cooldown_start, :cooldown_end, :status, presence: true
end
