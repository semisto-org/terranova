# frozen_string_literal: true

class Revenue < ApplicationRecord
  include SoftDeletable

  POLES = %w[academy design_studio nursery roots].freeze
  STATUSES = %w[draft confirmed received].freeze

  belongs_to :contact, optional: true
  belongs_to :training, class_name: "Academy::Training", optional: true
  belongs_to :design_project, class_name: "Design::Project", optional: true

  validates :amount, numericality: { greater_than_or_equal_to: 0 }
  validates :pole, inclusion: { in: POLES }, allow_blank: true
  validates :status, inclusion: { in: STATUSES }
end
