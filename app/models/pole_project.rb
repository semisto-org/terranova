# frozen_string_literal: true

class PoleProject < ApplicationRecord
  include Projectable

  has_many :actions, dependent: :destroy
  has_many :notes, dependent: :destroy
  has_many :events, dependent: :nullify
  has_many :timesheets, dependent: :nullify
  has_many_attached :documents

  POLES = %w[academy design nursery].freeze

  validates :name, presence: true
  validates :pole, inclusion: { in: POLES }, allow_nil: true
end
