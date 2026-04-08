# frozen_string_literal: true

class BankReconciliation < ApplicationRecord
  CONFIDENCES = %w[auto manual suggested].freeze
  RECONCILABLE_TYPES = %w[Expense Revenue].freeze

  belongs_to :bank_transaction
  belongs_to :reconcilable, polymorphic: true
  belongs_to :matched_by, class_name: "Member", optional: true

  validates :bank_transaction_id, uniqueness: true
  validates :confidence, presence: true, inclusion: { in: CONFIDENCES }
  validates :reconcilable_type, inclusion: { in: RECONCILABLE_TYPES }

  after_create :mark_transaction_matched
  after_destroy :mark_transaction_unmatched

  private

  def mark_transaction_matched
    bank_transaction.mark_matched!
  end

  def mark_transaction_unmatched
    bank_transaction.mark_unmatched!
  end
end
