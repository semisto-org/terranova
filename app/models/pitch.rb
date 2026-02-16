class Pitch < ApplicationRecord
  include SoftDeletable
  belongs_to :author, class_name: "Member", optional: true

  has_many :bets, dependent: :destroy
  has_many :scopes, dependent: :destroy
  has_many :chowder_items, dependent: :destroy
  has_many :hill_chart_snapshots, dependent: :destroy

  enum :status, {
    raw: "raw",
    shaped: "shaped",
    betting: "betting",
    building: "building",
    completed: "completed",
    cancelled: "cancelled"
  }, validate: true

  enum :appetite, {
    two_weeks: "2-weeks",
    three_weeks: "3-weeks",
    six_weeks: "6-weeks"
  }, validate: true

  validates :title, :problem, :solution, :status, :appetite, presence: true
end
