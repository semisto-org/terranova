# frozen_string_literal: true

# Service unique de génération (#104) — point d'entrée de TOUTE la plomberie
# async calme. Séquence invariante (décision d'architecture du 11/06) :
#
#   1. Écrire l'ActivityEvent (flux ambiant #110 — toujours, même sans abonné).
#   2. Fan-out des Notification vers les destinataires (boîte Hey! #105).
#
# Destinataires par défaut : `subject.notifiable_member_ids` (#103 — abonnés
# actifs, mute projet respecté, suivi explicite prime). L'acteur n'est JAMAIS
# notifié. Idempotence du fan-out garantie par l'index unique
# (recipient, activity_event) + `create_or_find_by`.
#
# Conçu ouvert : un nouveau type d'événement (ex. réponse de check-in,
# Phase 3) = un appel `NotificationService.record!` supplémentaire — aucune
# refonte. `kind_for` permet des kinds par destinataire (ex. `mention` pour
# les membres mentionnés, `comment` pour les autres abonnés du même événement).
class NotificationService
  # action       — verbe de l'événement (ex. "task_assigned", "comment_created")
  # subject      — l'objet de l'événement (porte aussi le lien cliquable)
  # actor        — le membre à l'origine (nil accepté, cf. décision #110)
  # recipients   — ids explicites ; défaut = subject.notifiable_member_ids
  # kind_for     — lambda(recipient_id) → kind ; défaut = action
  # notifiable   — objet pointé par la notification ; défaut = subject
  def self.record!(action:, subject:, actor: nil, recipients: nil, kind_for: nil, notifiable: nil)
    event = ActivityEvent.create!(
      action: action,
      subject: subject,
      actor: actor,
      projectable: resolve_projectable(subject)
    )

    recipient_ids = recipients || default_recipients(subject)
    recipient_ids = recipient_ids.uniq - [actor&.id].compact

    notifiable ||= subject
    recipient_ids.each do |recipient_id|
      Notification.create_or_find_by!(recipient_id: recipient_id, activity_event_id: event.id) do |n|
        n.notifiable = notifiable
        n.actor = actor
        n.kind = kind_for ? kind_for.call(recipient_id) : action
      end
    end

    event
  end

  def self.default_recipients(subject)
    return subject.notifiable_member_ids if subject.respond_to?(:notifiable_member_ids)

    []
  end

  # Projet parent pour le filtrage cross-projets d'Activity (#110).
  def self.resolve_projectable(subject)
    if subject.respond_to?(:notification_project)
      subject.notification_project
    elsif subject.is_a?(Comment) && subject.commentable.respond_to?(:notification_project)
      subject.commentable.notification_project
    end
  end
end
