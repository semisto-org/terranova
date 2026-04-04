# frozen_string_literal: true

class BankConnection < ApplicationRecord
  PROVIDERS = %w[gocardless].freeze
  STATUSES = %w[linked expired suspended].freeze

  belongs_to :connected_by, class_name: "Member"
  has_many :bank_transactions, dependent: :destroy

  validates :provider, presence: true, inclusion: { in: PROVIDERS }
  validates :bank_name, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :active, -> { where(status: "linked") }

  def consent_expiring_soon?
    consent_expires_at.present? && consent_expires_at < 30.days.from_now
  end

  def consent_expired?
    consent_expires_at.present? && consent_expires_at < Time.current
  end

  def mark_expired!
    update!(status: "expired")
  end
end
