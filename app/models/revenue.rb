# frozen_string_literal: true

class Revenue < ApplicationRecord
  include SoftDeletable

  POLES = %w[academy design_studio nursery roots shop].freeze
  STATUSES = %w[draft confirmed received].freeze

  has_many :bank_reconciliations, as: :reconcilable, class_name: "BankReconciliation", dependent: :destroy
  has_many_attached :documents

  belongs_to :contact, optional: true
  belongs_to :projectable, polymorphic: true, optional: true
  belongs_to :organization

  before_validation :assign_default_organization, on: :create

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

  private

  def assign_default_organization
    self.organization ||= Organization.default
  end

  def refresh_linked_registration_payment_status
    return unless projectable_type == "Academy::TrainingRegistration"
    return unless saved_change_to_status? || saved_change_to_amount? || saved_change_to_projectable_id? || destroyed?

    projectable&.recompute_payment_status_from_revenues!
  end
end
