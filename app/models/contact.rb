# frozen_string_literal: true

class Contact < ApplicationRecord
  include SoftDeletable
  CONTACT_TYPES = %w[person organization].freeze

  belongs_to :organization, class_name: "Contact", optional: true
  has_many :people, class_name: "Contact", foreign_key: :organization_id, dependent: :nullify
  has_many :contact_tags, dependent: :destroy
  has_many :expenses_as_supplier, class_name: "Expense", foreign_key: :supplier_contact_id, dependent: :nullify

  validates :contact_type, inclusion: { in: CONTACT_TYPES }
  validates :name, presence: true

  scope :people_only, -> { where(contact_type: "person") }
  scope :organizations_only, -> { where(contact_type: "organization") }

  def display_name
    name.presence || "Sans nom"
  end

  def person?
    contact_type == "person"
  end

  def organization?
    contact_type == "organization"
  end

  def tag_names
    contact_tags.pluck(:name)
  end
end
