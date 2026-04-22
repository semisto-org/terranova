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

  belongs_to :expense_category, optional: true
  belongs_to :supplier_contact, class_name: "Contact", optional: true
  belongs_to :projectable, polymorphic: true, optional: true
  belongs_to :organization

  before_validation :assign_default_organization, on: :create

  def assign_default_organization
    self.organization ||= Organization.default
  end

  has_many :bank_reconciliations, as: :reconcilable, class_name: "BankReconciliation", dependent: :destroy
  has_many :project_allocations, class_name: "ExpenseProjectAllocation", dependent: :destroy
  has_one_attached :document

  accepts_nested_attributes_for :project_allocations, allow_destroy: true

  validate :project_allocations_total_matches_expense

  def reconciled_amount
    bank_reconciliations.sum(:amount)
  end

  def fully_reconciled?
    (total_incl_vat - reconciled_amount).abs <= BankReconciliation::AMOUNT_TOLERANCE
  end

  def multi_project?
    project_allocations.any?
  end

  after_save :record_cash_movement!
  after_destroy :unrecord_cash_movement!

  def record_cash_movement!
    return unless payment_type == "cash"
    Cash::Bookkeeper.record_expense(self)
  end

  def unrecord_cash_movement!
    Cash::Bookkeeper.unrecord_expense(self)
  end

  before_validation :set_supplier_from_contact, if: :supplier_contact_id_changed?
  before_save :recompute_total_incl_vat_if_zero

  # Safety net: ensure TTC = HT + VAT even if an older code path forgets to set it.
  def recompute_total_incl_vat_if_zero
    return if total_incl_vat.to_d.positive?
    return unless amount_excl_vat.to_d.positive?

    self.total_incl_vat = amount_excl_vat.to_d + vat_6.to_d + vat_12.to_d + vat_21.to_d
  end

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

  def supplier_display_name
    supplier_contact&.name.presence || supplier.presence || ""
  end

  def planned?
    status == "planned"
  end

  private

  def project_allocations_total_matches_expense
    return unless project_allocations.any?
    return if project_allocations.all? { |a| a.marked_for_destruction? }

    live = project_allocations.reject(&:marked_for_destruction?)
    total = live.sum { |a| a.amount.to_d }
    if (total - total_incl_vat.to_d).abs > BankReconciliation::AMOUNT_TOLERANCE
      errors.add(
        :project_allocations,
        "La somme des allocations (#{total.round(2)} €) doit correspondre au total de la dépense (#{total_incl_vat.to_d.round(2)} €)"
      )
    end
  end

  def set_supplier_from_contact
    self.supplier = supplier_contact&.name if supplier_contact_id.present?
  end

  def supplier_or_contact_present
    return if supplier_contact_id.present?
    return if supplier.present?

    errors.add(:base, "Fournisseur requis : sélectionnez un contact ou saisissez un nom")
  end

end
