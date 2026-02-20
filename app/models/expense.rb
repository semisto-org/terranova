# frozen_string_literal: true

class Expense < ApplicationRecord
  include SoftDeletable
  STATUSES = %w[planned processing ready_for_payment paid].freeze
  EXPENSE_TYPES = %w[
    services_and_goods salaries merchandise other corporate_tax
    exceptional_expenses financial_expenses provisions_and_depreciation taxes_and_duties
  ].freeze
  BILLING_ZONES = %w[belgium intra_eu extra_eu].freeze
  VAT_RATES = %w[0 6 12 21 na intracom].freeze
  EU_VAT_RATES = %w[0 6 12 21].freeze
  PAYMENT_TYPES = %w[
    card_triodos transfer_triodos cash reimbursement_michael member stripe_fee
  ].freeze
  REBILLING_STATUSES = %w[to_invoice invoiced].freeze
  POLES = %w[lab design academy nursery].freeze

  # Notion categories (label as stored)
  EXPENSE_CATEGORIES = [
    "Assurances",
    "Autres dépenses",
    "Bibliothèque",
    "Charges sociales",
    "Communication",
    "Contributions et adhésions",
    "Déplacements",
    "Entretien et réparations",
    "Événements",
    "Fournitures",
    "Frais bancaires",
    "Frais de formation",
    "Frais généraux",
    "Frais juridiques et comptables",
    "Hébergement et restauration",
    "In/out",
    "Indemnités et avantages",
    "Laboratoire",
    "Licences et abonnements",
    "Loyer",
    "Matériel et équipements",
    "Matériel plantations",
    "Plants",
    "Prestations",
    "Projets",
    "Projets innovants",
    "Publicité et promotion",
    "Relations publiques",
    "Rémunération des bénévoles",
    "Réserves",
    "Salaires",
    "Site web et médias sociaux",
    "Sponsoring",
    "Stock pour shop",
    "Subventions et aides",
    "Télécommunications",
    "Transport et logistique",
    "Visites et conférences"
  ].freeze

  belongs_to :supplier_contact, class_name: "Contact", optional: true
  belongs_to :design_project, class_name: "Design::Project", optional: true
  belongs_to :training, class_name: "Academy::Training", optional: true

  has_one_attached :document

  before_validation :set_supplier_from_contact, if: :supplier_contact_id_changed?

  validates :status, :expense_type, presence: true
  validates :invoice_date, presence: true, unless: :planned?
  validate :supplier_or_contact_present
  validates :status, inclusion: { in: STATUSES }
  validates :expense_type, inclusion: { in: EXPENSE_TYPES }
  validates :rebilling_status, inclusion: { in: REBILLING_STATUSES }, allow_blank: true
  validates :billing_zone, inclusion: { in: BILLING_ZONES }, allow_blank: true
  validates :payment_type, inclusion: { in: PAYMENT_TYPES }, allow_blank: true
  validates :vat_rate, inclusion: { in: VAT_RATES }, allow_blank: true
  validates :eu_vat_rate, inclusion: { in: EU_VAT_RATES }, allow_blank: true
  validates :category, inclusion: { in: EXPENSE_CATEGORIES }, allow_blank: true

  def supplier_display_name
    supplier_contact&.name.presence || supplier.presence || ""
  end

  def planned?
    status == "planned"
  end

  private

  def set_supplier_from_contact
    self.supplier = supplier_contact&.name if supplier_contact_id.present?
  end

  def supplier_or_contact_present
    return if supplier_contact_id.present?
    return if supplier.present?

    errors.add(:base, "Fournisseur requis : sélectionnez un contact ou saisissez un nom")
  end
end
