class EconomicInput < ApplicationRecord
  CATEGORIES = %w[plants materials labor other].freeze
  LABOR_TYPES = %w[plantation entretien recolte].freeze

  belongs_to :location, optional: true
  belongs_to :zone, class_name: "Location::Zone", optional: true
  belongs_to :design_project, class_name: "Design::Project", optional: true

  validates :date, :unit, presence: true
  validates :category, inclusion: { in: CATEGORIES }
  validates :amount_cents, numericality: { greater_than_or_equal_to: 0, only_integer: true }
  validates :quantity, numericality: { greater_than_or_equal_to: 0 }
  validates :labor_type, inclusion: { in: LABOR_TYPES }, allow_nil: true
  validate :labor_type_only_for_labor_category

  private

  def labor_type_only_for_labor_category
    if labor_type.present? && category != "labor"
      errors.add(:labor_type, "ne s'applique qu'à la catégorie labor")
    end
  end
end
