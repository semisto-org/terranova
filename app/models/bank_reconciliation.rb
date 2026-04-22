# frozen_string_literal: true

class BankReconciliation < ApplicationRecord
  AMOUNT_TOLERANCE = 0.01

  CONFIDENCES = %w[auto manual suggested].freeze
  RECONCILABLE_TYPES = %w[Expense Revenue].freeze

  belongs_to :bank_transaction
  belongs_to :reconcilable, polymorphic: true
  belongs_to :matched_by, class_name: "Member", optional: true

  validates :confidence, presence: true, inclusion: { in: CONFIDENCES }
  validates :reconcilable_type, inclusion: { in: RECONCILABLE_TYPES }
  validates :amount, numericality: { greater_than: 0 }
  validate :allocation_within_transaction_amount

  after_save :refresh_transaction_status
  after_destroy :refresh_transaction_status
  after_create :learn_supplier_iban

  private

  def learn_supplier_iban
    return unless reconcilable_type == "Expense"

    tx_iban = bank_transaction&.counterpart_iban.to_s.gsub(/\s+/, "").upcase
    return if tx_iban.blank?

    contact = reconcilable&.supplier_contact
    return unless contact
    return if contact.iban.present?

    contact.update_column(:iban, tx_iban)
  end

  def refresh_transaction_status
    bank_transaction.refresh_matching_status!
  end

  def allocation_within_transaction_amount
    return unless bank_transaction && amount

    tx_total = bank_transaction.amount.abs
    siblings_total = bank_transaction.bank_reconciliations.where.not(id: id).sum(:amount)
    projected = siblings_total + amount

    if projected > tx_total + AMOUNT_TOLERANCE
      errors.add(:amount, "dépasse le montant restant de la transaction (reste : #{(tx_total - siblings_total).round(2)} €)")
    end
  end
end
