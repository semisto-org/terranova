# frozen_string_literal: true

class Organization < ApplicationRecord
  has_one_attached :logo
  has_many :expense_notes, dependent: :restrict_with_error
  has_many :bank_connections, dependent: :restrict_with_error
  has_one :cash_account, -> { where(provider: "cash") }, class_name: "BankConnection"
  has_many :expenses, dependent: :restrict_with_error
  has_many :revenues, dependent: :restrict_with_error

  validates :name, presence: true

  scope :active, -> { where(archived_at: nil) }

  before_save :ensure_single_default
  after_create :ensure_cash_account!

  def self.default
    active.find_by(is_default: true) || active.order(:created_at).first
  end

  def archived?
    archived_at.present?
  end

  def vat_regime
    vat_subject? ? "subject" : "exempt"
  end

  def cash_balance
    cash_account&.balance.to_f
  end

  def ensure_cash_account!
    return if BankConnection.where(organization_id: id, provider: "cash").exists?

    connected_by = Member.where(is_admin: true).order(:id).first
    BankConnection.create!(
      provider: "cash",
      bank_name: "Caisse",
      status: "linked",
      accounting_scope: "general",
      organization: self,
      is_virtual: true,
      connected_by: connected_by
    )
  end

  private

  def ensure_single_default
    return unless is_default? && (new_record? || is_default_changed?)

    Organization.where.not(id: id).where(is_default: true).update_all(is_default: false)
  end
end
