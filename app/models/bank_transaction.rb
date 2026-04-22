# frozen_string_literal: true

class BankTransaction < ApplicationRecord
  STATUSES = %w[unmatched matched ignored partially_matched].freeze

  belongs_to :bank_connection
  has_many :bank_reconciliations, dependent: :destroy

  delegate :vat_regime, :accounting_scope, to: :bank_connection

  validates :provider_transaction_id, presence: true, uniqueness: true
  validates :date, presence: true
  validates :amount, presence: true
  validates :currency, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :unmatched, -> { where(status: %w[unmatched partially_matched]) }
  scope :fully_matched, -> { where(status: "matched") }
  scope :matched, -> { where(status: "matched") }
  scope :ignored, -> { where(status: "ignored") }
  scope :debits, -> { where("amount < 0") }
  scope :credits, -> { where("amount > 0") }

  def debit?
    amount.negative?
  end

  def credit?
    amount.positive?
  end

  def allocated_amount
    bank_reconciliations.sum(:amount)
  end

  def remaining_amount
    (amount.abs - allocated_amount).round(2)
  end

  def fully_allocated?
    remaining_amount <= BankReconciliation::AMOUNT_TOLERANCE
  end

  def mark_matched!
    update!(status: "matched")
  end

  def mark_ignored!
    update!(status: "ignored")
  end

  def mark_unmatched!
    update!(status: "unmatched")
  end

  def refresh_matching_status!
    return if status == "ignored"

    new_status =
      if bank_reconciliations.empty?
        "unmatched"
      elsif fully_allocated?
        "matched"
      else
        "partially_matched"
      end

    update!(status: new_status) if status != new_status
  end
end
