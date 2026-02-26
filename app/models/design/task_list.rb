# frozen_string_literal: true

module Design
  class TaskList < ApplicationRecord
    self.table_name = "design_task_lists"

    belongs_to :project, class_name: "Design::Project"
    has_many :tasks, class_name: "Design::Task", foreign_key: :task_list_id, dependent: :destroy

    validates :name, presence: true
  end
end
