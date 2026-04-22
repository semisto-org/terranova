# frozen_string_literal: true

class BankMatchingRule < ApplicationRecord
  PATTERN_FIELDS = %w[counterpart_name remittance_info counterpart_iban].freeze

  belongs_to :organization, optional: true
  belongs_to :suggested_supplier_contact, class_name: "Contact", optional: true
  belongs_to :suggested_expense_category, class_name: "ExpenseCategory", optional: true
  belongs_to :created_by, class_name: "Member", optional: true

  validates :pattern_field, presence: true, inclusion: { in: PATTERN_FIELDS }
  validates :pattern_value, presence: true
  validate :at_least_one_suggestion

  scope :for_organization, ->(org) { where(organization_id: [nil, org&.id]) }

  # Returns all rules whose pattern matches the transaction.
  # Matching is case-insensitive substring ("contains"), applied to the
  # chosen pattern_field on the transaction.
  def self.applicable_to(transaction)
    for_organization(transaction.bank_connection.organization).select do |rule|
      value = transaction.public_send(rule.pattern_field).to_s
      next false if value.blank?
      value.downcase.include?(rule.pattern_value.downcase)
    end
  end

  # Apply the rule to a candidate Expense (pre-fill suggestions). Only sets
  # fields that aren't already populated — never overwrites user input.
  def apply_to_expense(expense)
    expense.supplier_contact_id ||= suggested_supplier_contact_id if suggested_supplier_contact_id
    expense.expense_category_id ||= suggested_expense_category_id if suggested_expense_category_id
    expense.category ||= suggested_expense_category&.label if suggested_expense_category
    expense.expense_type = suggested_expense_type if suggested_expense_type.present? && expense.expense_type.blank?
    expense.vat_rate = suggested_vat_rate if suggested_vat_rate.present? && expense.vat_rate.blank?
    expense
  end

  def mark_applied!
    update_columns(last_applied_at: Time.current, applied_count: applied_count + 1)
  end

  private

  def at_least_one_suggestion
    return if suggested_supplier_contact_id.present? ||
              suggested_expense_category_id.present? ||
              suggested_expense_type.present? ||
              suggested_vat_rate.present?

    errors.add(:base, "La règle doit proposer au moins une valeur (fournisseur, catégorie, type ou TVA)")
  end
end
