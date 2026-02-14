class Bet < ApplicationRecord
  belongs_to :pitch
  belongs_to :cycle
  belongs_to :placed_by, class_name: "Member", optional: true

  has_many :bet_team_memberships, dependent: :destroy
  has_many :team_members, through: :bet_team_memberships, source: :member

  enum :status, {
    pending: "pending",
    in_progress: "in_progress",
    completed: "completed",
    cancelled: "cancelled"
  }, validate: true

  validates :placed_at, :status, presence: true
end
