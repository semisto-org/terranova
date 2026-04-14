# frozen_string_literal: true

class ExpenseNoteLine < ApplicationRecord
  belongs_to :expense_note, inverse_of: :lines

  validates :label, presence: true
  validates :quantity, numericality: { greater_than: 0 }
  validates :unit_amount_cents, numericality: { greater_than_or_equal_to: 0 }

  before_save :compute_line_total
  after_save :recalculate_parent_total
  after_destroy :recalculate_parent_total

  private

  def compute_line_total
    self.line_total_cents = (BigDecimal(unit_amount_cents.to_s) * BigDecimal(quantity.to_s)).round.to_i
  end

  def recalculate_parent_total
    expense_note.recalculate_total! if expense_note && !expense_note.destroyed?
  end
end
