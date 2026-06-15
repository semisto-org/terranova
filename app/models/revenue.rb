# frozen_string_literal: true

class Revenue < ApplicationRecord
  include SoftDeletable

  POLES = %w[academy design_studio nursery roots shop].freeze
  STATUSES = %w[draft confirmed received].freeze

  # Libellé client unifié pour la contribution au fonctionnement (délibération #20).
  CONTRIBUTION_LABEL = 'Contribution au fonctionnement de Semisto ASBL'

  validates :contribution_semisto_amount, numericality: { greater_than_or_equal_to: 0 }

  has_many :bank_reconciliations, as: :reconcilable, class_name: "BankReconciliation", dependent: :destroy
  has_many_attached :documents

  belongs_to :contact, optional: true
  belongs_to :projectable, polymorphic: true, optional: true
  belongs_to :organization

  before_validation :assign_default_organization, on: :create
  before_validation :normalize_not_null_strings

  validates :amount, numericality: { greater_than_or_equal_to: 0 }
  validates :pole, inclusion: { in: POLES }, allow_blank: true
  validates :status, inclusion: { in: STATUSES }

  after_save :refresh_linked_registration_payment_status
  after_destroy :refresh_linked_registration_payment_status

  def reconciled_amount
    bank_reconciliations.sum(:amount)
  end

  def fully_reconciled?
    (amount - reconciled_amount).abs <= BankReconciliation::AMOUNT_TOLERANCE
  end

  # Increase the revenue total by a delta — e.g. an extra bank transaction
  # allocated to the same revenue. HT / VAT are scaled proportionally so that
  # amount = HT + VAT stays consistent. Used by the reconciliation
  # "add this amount to the total" option.
  def add_to_total!(delta)
    delta = delta.to_d
    return if delta <= 0

    current = amount.to_d
    if current.positive?
      factor = (current + delta) / current
      self.amount_excl_vat = (amount_excl_vat.to_d * factor).round(2)
      self.vat_6  = (vat_6.to_d  * factor).round(2)
      self.vat_21 = (vat_21.to_d * factor).round(2)
      self.amount = amount_excl_vat + vat_6 + vat_21
    else
      self.amount_excl_vat = amount_excl_vat.to_d + delta
      self.amount = delta
    end
    save!
  end

  private

  def assign_default_organization
    self.organization ||= Organization.default
  end

  # `vat_rate` is a NOT NULL string column (default ""), but clients (e.g. the
  # admin revenue form) send `null` when the VAT rate is blank — which raises a
  # PG::NotNullViolation on update. Coerce nil back to the column default.
  def normalize_not_null_strings
    self.vat_rate = "" if vat_rate.nil?
  end

  def refresh_linked_registration_payment_status
    return unless projectable_type == "Academy::TrainingRegistration"
    return unless saved_change_to_status? || saved_change_to_amount? || saved_change_to_projectable_id? || destroyed?

    projectable&.recompute_payment_status_from_revenues!
  end
end
