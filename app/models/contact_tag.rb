# frozen_string_literal: true

class ContactTag < ApplicationRecord
  belongs_to :contact

  validates :name, presence: true
  validates :name, uniqueness: { scope: :contact_id }
end
