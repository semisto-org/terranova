# frozen_string_literal: true

class Task < ApplicationRecord
  STATUSES = %w[pending in_progress completed].freeze
  PRIORITIES = %w[low medium high].freeze

  belongs_to :task_list
  belongs_to :assignee, class_name: "Member", optional: true
  belongs_to :assigned_by, class_name: "Member", optional: true
  belongs_to :completed_by, class_name: "Member", optional: true
  belongs_to :pinged_by, class_name: "Member", optional: true
  belongs_to :parent, class_name: "Task", optional: true

  has_many :children, class_name: "Task", foreign_key: :parent_id, dependent: :nullify
  has_many :comments, as: :commentable, dependent: :destroy

  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :priority, inclusion: { in: PRIORITIES }, allow_nil: true

  # Tâches étoilées (« ma sélection »), avec un coucou en attente, ou terminées
  # récemment (pour les garder visibles dans le drawer au lieu de les faire
  # disparaître au moment où on les coche).
  scope :starred, -> { where.not(starred_at: nil) }
  scope :pinged, -> { where.not(pinged_at: nil) }
  scope :recently_completed, ->(days = 14) {
    where(status: "completed").where("completed_at >= ?", days.to_i.days.ago)
  }

  # Traçabilité : on pose assigned_at au moment où une tâche reçoit un assigné,
  # et completed_at/by au passage en « completed » (remis à nil si on rouvre).
  # assigned_by et completed_by sont renseignés par le contrôleur (qui connaît
  # le membre courant) ; ici on garantit la cohérence des horodatages.
  before_save :stamp_assignment, if: :will_save_change_to_assignee_id?
  before_save :stamp_completion, if: :will_save_change_to_status?

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

  def starred?
    starred_at.present?
  end

  def pinged?
    pinged_at.present?
  end

  private

  def stamp_assignment
    if assignee_id.present?
      self.assigned_at ||= Time.current
    else
      # Désassignation : on efface la traçabilité d'assignation.
      self.assigned_at = nil
      self.assigned_by_id = nil
    end
  end

  def stamp_completion
    if status == "completed"
      self.completed_at ||= Time.current
    else
      self.completed_at = nil
      self.completed_by_id = nil
    end
  end

  def assignee_belongs_to_project_team
    return if assignee_id.blank?

    projectable = task_list&.taskable
    return unless projectable.respond_to?(:project_member_ids)

    unless projectable.project_member_ids.include?(assignee_id)
      errors.add(:assignee, "doit faire partie de l'équipe du projet")
    end
  end
end
