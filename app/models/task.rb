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

  # Une tâche ne peut être assignée qu'à un membre de l'équipe du projet auquel
  # elle appartient. La règle vit dans le modèle (et non seulement dans un
  # contrôleur) pour couvrir tous les chemins de création de tâches —
  # tasks_controller (unified), lab_management et design_studio.
  #
  # Ne se déclenche QUE quand l'assignation change (création ou réassignation) :
  # on évite ainsi de bloquer la sauvegarde d'une tâche existante (changement de
  # statut, d'échéance…) dont l'assigné aurait depuis quitté l'équipe. Les tâches
  # legacy en texte libre (assignee_name sans assignee_id) restent aussi valides.
  validate :assignee_belongs_to_project_team, if: :will_save_change_to_assignee_id?

  private

  def assignee_belongs_to_project_team
    return if assignee_id.blank?

    projectable = task_list&.taskable
    return unless projectable.respond_to?(:project_member_ids)

    unless projectable.project_member_ids.include?(assignee_id)
      errors.add(:assignee, "doit faire partie de l'équipe du projet")
    end
  end
end
