# frozen_string_literal: true

class Revenue < ApplicationRecord
  include SoftDeletable

  POLES = %w[academy design_studio nursery roots].freeze
  STATUSES = %w[draft confirmed received].freeze

  has_one :bank_reconciliation, as: :reconcilable, class_name: "BankReconciliation", dependent: :nullify

  belongs_to :contact, optional: true
  belongs_to :projectable, polymorphic: true, optional: true

  validates :amount, numericality: { greater_than_or_equal_to: 0 }
  validates :pole, inclusion: { in: POLES }, allow_blank: true
  validates :status, inclusion: { in: STATUSES }
end
