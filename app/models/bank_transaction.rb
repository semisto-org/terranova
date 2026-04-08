# frozen_string_literal: true

class BankTransaction < ApplicationRecord
  STATUSES = %w[unmatched matched ignored].freeze

  belongs_to :bank_connection
  has_one :bank_reconciliation, dependent: :destroy

  validates :provider_transaction_id, presence: true, uniqueness: true
  validates :date, presence: true
  validates :amount, presence: true
  validates :currency, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :unmatched, -> { where(status: "unmatched") }
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

  def mark_matched!
    update!(status: "matched")
  end

  def mark_ignored!
    update!(status: "ignored")
  end

  def mark_unmatched!
    update!(status: "unmatched")
  end
end
