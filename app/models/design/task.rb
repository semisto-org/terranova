# frozen_string_literal: true

module Design
  class Task < ApplicationRecord
    self.table_name = "design_tasks"

    belongs_to :task_list, class_name: "Design::TaskList"
    belongs_to :assignee, class_name: "Member", optional: true, foreign_key: :assignee_id

    validates :name, presence: true
    validates :status, inclusion: { in: %w[pending completed] }
  end
end
