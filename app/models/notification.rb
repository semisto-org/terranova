# frozen_string_literal: true

# Notification interne (#104) — toujours dérivée d'un ActivityEvent par
# NotificationService (jamais créée à la main : l'événement d'abord, le
# fan-out ensuite). Consommée par la boîte Hey! (#105).
#
# KINDS n'est pas une liste fermée validée : ajouter un type de notification
# (ex. réponse de check-in en Phase 3) ne doit pas exiger de refonte —
# critère « conçu ouvert » de l'issue.
class Notification < ApplicationRecord
  belongs_to :recipient, class_name: "Member"
  belongs_to :activity_event
  belongs_to :notifiable, polymorphic: true
  belongs_to :actor, class_name: "Member", optional: true

  validates :kind, presence: true

  scope :unread, -> { where(read_at: nil) }
  scope :recent_first, -> { order(created_at: :desc) }

  def read?
    read_at.present?
  end

  def mark_read!
    update!(read_at: Time.current) unless read?
  end

  # Libellé lisible pour le digest email (#106). Conçu ouvert : un kind inconnu
  # retombe sur une forme humanisée plutôt que de planter.
  KIND_VERBS = {
    "assignment" => "vous a assigné",
    "task_assigned" => "vous a assigné",
    "mention" => "vous a mentionné·e sur",
    "comment" => "a commenté",
    "comment_created" => "a commenté",
    "ping" => "vous a fait coucou sur",
    "due_soon" => "— échéance proche :",
    "task_due_soon" => "— échéance proche :"
  }.freeze

  def summary
    verb = KIND_VERBS[kind] || kind.to_s.tr("_", " ")
    [actor_name, verb, target_label].compact.join(" ").strip
  end

  def actor_name
    return "Quelqu'un" if actor.nil?

    "#{actor.first_name} #{actor.last_name}".strip
  end

  def target_label
    target = notifiable
    return nil if target.nil?

    if target.respond_to?(:title) && target.title.present?
      "« #{target.title.to_s.truncate(60)} »"
    elsif target.respond_to?(:name) && target.name.present?
      "« #{target.name.to_s.truncate(60)} »"
    end
  end
end
