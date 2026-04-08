# frozen_string_literal: true

class Task < ApplicationRecord
  STATUSES = %w[pending in_progress completed].freeze
  PRIORITIES = %w[low medium high].freeze

  belongs_to :task_list
  belongs_to :assignee, class_name: "Member", optional: true
  belongs_to :parent, class_name: "Task", optional: true

  has_many :children, class_name: "Task", foreign_key: :parent_id, dependent: :nullify

  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :priority, inclusion: { in: PRIORITIES }, allow_nil: true
end
