# frozen_string_literal: true

class BucketTransaction < ApplicationRecord
  include SoftDeletable

  KINDS = %w[credit debit].freeze

  belongs_to :projectable, polymorphic: true
  belongs_to :member, optional: true

  validates :kind, inclusion: { in: KINDS }
  validates :amount, numericality: { greater_than: 0 }
  validates :description, :date, :recorded_by_id, :recorded_by_name, presence: true
end
