class Timesheet < ApplicationRecord
  include SoftDeletable
  belongs_to :member
  belongs_to :guild, optional: true

  enum :payment_type, {
    invoice: "invoice",
    semos: "semos"
  }, validate: true

  enum :category, {
    design: "design",
    formation: "formation",
    administratif: "administratif",
    coordination: "coordination",
    communication: "communication"
  }, validate: true

  validates :date, :hours, :payment_type, :category, presence: true
  validates :hours, numericality: { greater_than: 0 }
end
