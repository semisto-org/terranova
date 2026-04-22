# frozen_string_literal: true

class BankConnection < ApplicationRecord
  PROVIDERS = %w[gocardless coda_import stripe cash].freeze
  STATUSES = %w[linked expired suspended].freeze
  ACCOUNTING_SCOPES = %w[general nursery].freeze
  VAT_REGIMES = %w[subject exempt].freeze

  belongs_to :connected_by, class_name: "Member", optional: true
  belongs_to :organization
  has_many :bank_transactions, dependent: :destroy

  validates :provider, presence: true, inclusion: { in: PROVIDERS }
  validates :bank_name, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :accounting_scope, presence: true, inclusion: { in: ACCOUNTING_SCOPES }

  scope :active, -> { where(status: "linked") }
  scope :real_accounts, -> { where.not(provider: "cash") }
  scope :cash_accounts, -> { where(provider: "cash") }

  def virtual?
    is_virtual? || provider == "cash"
  end

  def cash?
    provider == "cash"
  end

  def balance
    bank_transactions.sum(:amount).to_f
  end

  # Returns the poles this connection's scope is restricted to, or nil for all poles.
  def scope_poles
    case accounting_scope
    when "nursery" then %w[nursery]
    else nil
    end
  end

  delegate :vat_regime, :vat_subject, :vat_subject?, to: :organization

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
