# frozen_string_literal: true

class Organization < ApplicationRecord
  has_one_attached :logo
  has_many :expense_notes, dependent: :restrict_with_error

  validates :name, presence: true

  scope :active, -> { where(archived_at: nil) }

  before_save :ensure_single_default

  def self.default
    active.find_by(is_default: true) || active.order(:created_at).first
  end

  def archived?
    archived_at.present?
  end

  private

  def ensure_single_default
    return unless is_default? && (new_record? || is_default_changed?)

    Organization.where.not(id: id).where(is_default: true).update_all(is_default: false)
  end
end
