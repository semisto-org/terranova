# frozen_string_literal: true

module Academy
  # Génère les tâches automatiques d'une activité à partir des templates définis
  # sur son type (séance 2). Deux portées :
  #   - "activity" : une tâche par activité, datée par rapport au début/fin de
  #     l'activité (= 1re/dernière session).
  #   - "session"  : une tâche par session, datée par rapport au début/fin de
  #     cette session.
  # offset_days signé : négatif = avant l'ancre, positif = après.
  class TaskGenerator
    DEFAULT_LIST_NAME = "À faire"

    # Checklist d'annulation (séance 2, validée par Michael 2026-06-01). Codée en
    # dur : universelle pour tous les types d'activité (pas de template configurable).
    # Générée à échéance du jour de l'annulation, non assignée. L'ordre fait foi.
    CANCELLATION_TASKS = [
      "Prévenir le formateur / la formatrice + assistants éventuels",
      "Prévenir la personne de contact pour le lieu",
      "Prévenir les participants",
      "Procéder aux remboursements",
      "Prévenir la personne qui prépare les repas",
      "Marquer l'événement comme annulé sur Facebook"
    ].freeze

    def self.for_training(training)
      new(training).seed_activity_tasks
    end

    def self.for_session(session)
      gen = new(session.training)
      gen.refresh_activity_tasks   # les dates d'activité dépendent des sessions
      gen.generate_session_tasks(session)
    end

    # Crée la checklist d'annulation (idempotent par nom : pas de doublon si on
    # ré-annule après une désannulation). Échéance = jour de l'annulation,
    # calculée en Europe/Brussels. Indépendant des templates du type d'activité.
    def self.cancellation_checklist_for(training)
      new(training).seed_cancellation_tasks
    end

    def initialize(training)
      @training = training
      @type = training&.training_type
    end

    # Crée (idempotent par nom) les tâches de portée activité. Dates calculées
    # depuis les sessions existantes (nil si aucune encore).
    def seed_activity_tasks
      return unless templates?

      activity_templates.each do |tpl|
        next if activity_task_exists?(tpl["name"])

        default_list.tasks.create!(
          name: tpl["name"],
          status: "pending",
          due_date: activity_due_date(tpl)
        )
      end
    end

    # Recalcule les échéances des tâches d'activité déjà créées (quand une
    # session est ajoutée/déplacée, l'ancre début/fin de l'activité change).
    def refresh_activity_tasks
      return unless templates?

      seed_activity_tasks
      activity_templates.each do |tpl|
        task = @training.tasks.find_by(name: tpl["name"], academy_training_session_id: nil)
        next unless task

        new_due = activity_due_date(tpl)
        task.update_column(:due_date, new_due) if new_due && task.due_date != new_due
      end
    end

    # Crée les tâches de portée session pour une session donnée (idempotent :
    # ne régénère pas si la session a déjà des tâches générées).
    def generate_session_tasks(session)
      return unless templates?
      return if session_tasks_exist?(session)

      session_templates.each do |tpl|
        default_list.tasks.create!(
          name: "#{tpl['name']} — #{session_label(session)}",
          status: "pending",
          due_date: anchored_date(session_anchor_date(session, tpl["anchor"]), tpl["offset_days"]),
          academy_training_session_id: session.id
        )
      end
    end

    # Idempotent : ne recrée pas une tâche d'annulation déjà présente (dédup par
    # nom, portée activité). Échéance = aujourd'hui en Europe/Brussels.
    def seed_cancellation_tasks
      due = Time.find_zone!("Europe/Brussels").today

      CANCELLATION_TASKS.each do |name|
        next if activity_task_exists?(name)

        default_list.tasks.create!(name: name, status: "pending", due_date: due)
      end
    end

    private

    def templates?
      @type.present? && @type.task_templates.present?
    end

    def activity_templates
      @type.task_templates.select { |t| t["scope"] == "activity" }
    end

    def session_templates
      @type.task_templates.select { |t| t["scope"] == "session" }
    end

    def default_list
      @default_list ||= @training.unified_task_lists.order(:position, :created_at).first ||
        @training.unified_task_lists.create!(name: DEFAULT_LIST_NAME, position: 0)
    end

    def activity_task_exists?(name)
      @training.tasks.exists?(name: name, academy_training_session_id: nil)
    end

    def session_tasks_exist?(session)
      @training.tasks.where(academy_training_session_id: session.id).exists?
    end

    def activity_due_date(tpl)
      anchor = tpl["anchor"] == "end" ? activity_end_date : activity_start_date
      anchored_date(anchor, tpl["offset_days"])
    end

    # Requête fraîche (pas l'association en cache, qui peut avoir été chargée
    # vide avant l'ajout d'une session sur la même instance en mémoire).
    def sessions
      Academy::TrainingSession.where(training_id: @training.id)
    end

    def activity_start_date
      sessions.map(&:start_date).compact.min
    end

    def activity_end_date
      sessions.map { |s| s.end_date || s.start_date }.compact.max
    end

    def session_anchor_date(session, anchor)
      anchor == "end" ? (session.end_date || session.start_date) : session.start_date
    end

    def anchored_date(anchor_date, offset_days)
      return nil if anchor_date.blank?

      anchor_date.to_date + offset_days.to_i.days
    end

    def session_label(session)
      session.start_date&.strftime("%-d %b %Y") || "session"
    end
  end
end
