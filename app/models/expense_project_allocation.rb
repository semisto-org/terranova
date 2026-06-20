# frozen_string_literal: true

class ExpenseProjectAllocation < ApplicationRecord
  include FinanceGuarded # refuse l'allocation vers un projet interne (#159)

  belongs_to :expense
  belongs_to :projectable, polymorphic: true

  validates :amount, numericality: { greater_than: 0 }
end
