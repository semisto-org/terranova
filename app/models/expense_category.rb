class ExpenseCategory < ApplicationRecord
  include SoftDeletable

  has_many :expenses, dependent: :restrict_with_error

  validates :label, presence: true, uniqueness: { case_sensitive: false }

  scope :ordered, -> { order(Arel.sql("LOWER(label)")) }
end
