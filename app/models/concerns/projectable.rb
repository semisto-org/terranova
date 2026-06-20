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
    has_many :posts, as: :projectable, dependent: :destroy
    has_many :subscriptions, as: :subscribable, dependent: :destroy
    has_many :chat_messages, as: :projectable, dependent: :destroy
    has_many_attached :project_documents
  end

  def project_name
    respond_to?(:title) ? title : name
  end

  def attributed_expenses
    primary_expenses = expenses
      .where(deleted_at: nil)
      .where.not(id: ExpenseProjectAllocation.select(:expense_id))
      .select(:id)

    allocated_expenses = ExpenseProjectAllocation
      .where(projectable_type: self.class.name, projectable_id: id)
      .select(:expense_id)

    Expense
      .where(id: primary_expenses)
      .or(Expense.where(deleted_at: nil, id: allocated_expenses))
      .distinct
      .includes(:project_allocations)
  end

  # ── Mute projet (#103) ────────────────────────────────────────────────────
  # Un membre peut couper TOUTES les notifications d'un projet (état `muted`
  # sur le Projectable lui-même). Le suivi explicite d'un objet du projet
  # prime sur ce mute (cf. Subscribable#notifiable_member_ids).

  def mute!(member)
    sub = subscriptions.find_or_initialize_by(member_id: member.id)
    sub.update!(state: "muted")
    sub
  end

  def unmute!(member)
    subscriptions.where(member_id: member.id, state: "muted").destroy_all
  end

  def muted_by?(member)
    return false if member.nil?

    subscriptions.muted.exists?(member_id: member.id)
  end

  def muted_member_ids
    subscriptions.muted.pluck(:member_id)
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
