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
end
