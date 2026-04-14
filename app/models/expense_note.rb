# frozen_string_literal: true

class ExpenseNote < ApplicationRecord
  include SoftDeletable

  STATUSES = %w[draft to_send sent paid].freeze

  belongs_to :contact
  belongs_to :organization
  has_many :lines, -> { order(:position, :id) },
           class_name: "ExpenseNoteLine",
           inverse_of: :expense_note,
           dependent: :destroy
  accepts_nested_attributes_for :lines, allow_destroy: true

  validates :subject, presence: true
  validates :note_date, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :number, presence: true, uniqueness: true

  before_validation :assign_number, on: :create
  before_validation :default_note_date, on: :create

  def total_amount
    total_cents.to_i / 100.0
  end

  def recalculate_total!
    update_column(:total_cents, lines.sum(:line_total_cents))
  end

  def self.next_number_for(year)
    prefix = "NF-#{year}-"
    last = with_deleted.where("number LIKE ?", "#{prefix}%").order(:number).last
    next_seq = last ? last.number.split("-").last.to_i + 1 : 1
    "#{prefix}#{next_seq.to_s.rjust(4, "0")}"
  end

  private

  def assign_number
    return if number.present?

    self.number = self.class.next_number_for((note_date || Date.current).year)
  end

  def default_note_date
    self.note_date ||= Date.current
  end
end
