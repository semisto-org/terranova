# frozen_string_literal: true

module Projectable
  extend ActiveSupport::Concern

  included do
    has_many :unified_task_lists, class_name: "TaskList", as: :taskable, dependent: :destroy
    has_many :tasks, through: :unified_task_lists
    has_many :project_memberships, as: :projectable, dependent: :destroy
    has_many :project_members, through: :project_memberships, source: :member
    has_many :bucket_transactions, as: :projectable, dependent: :destroy
    has_many :expenses, as: :projectable, dependent: :destroy
    has_many :expense_allocations, class_name: "ExpenseProjectAllocation", as: :projectable, dependent: :destroy
    has_many :revenues, as: :projectable, dependent: :destroy
    has_many :timesheets, as: :projectable, dependent: :nullify
    has_many :events, as: :projectable, dependent: :nullify
    has_many :knowledge_sections, as: :projectable, dependent: :nullify
    has_many_attached :project_documents
  end

  def project_name
    respond_to?(:title) ? title : name
  end

  PROJECT_TYPE_KEYS = {
    "PoleProject" => "lab-project",
    "Academy::Training" => "training",
    "Design::Project" => "design-project",
    "Guild" => "guild"
  }.freeze

  def project_type_key
    PROJECT_TYPE_KEYS[self.class.name]
  end

  module ClassMethods
    def find_projectable(type_key, id)
      klass = PROJECT_TYPE_KEYS.key(type_key)
      raise ActiveRecord::RecordNotFound, "Unknown project type: #{type_key}" unless klass

      klass.constantize.find(id)
    end
  end
end
