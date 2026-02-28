class EconomicOutput < ApplicationRecord
  CATEGORIES = %w[harvest sale transformation donation autoconsumption].freeze

  belongs_to :location, optional: true
  belongs_to :zone, class_name: "Location::Zone", optional: true
  belongs_to :design_project, class_name: "Design::Project", optional: true
  belongs_to :species, class_name: "Plant::Species", optional: true

  validates :date, :unit, presence: true
  validates :category, inclusion: { in: CATEGORIES }
  validates :amount_cents, numericality: { greater_than_or_equal_to: 0, only_integer: true }, allow_nil: true
  validates :quantity, numericality: { greater_than_or_equal_to: 0 }
end
