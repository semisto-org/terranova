# frozen_string_literal: true

# Événement d'activité (#104, amendement 11/06) — 1 ligne par action, sans
# destinataire. C'est la source de vérité du flux ambiant (#110) ; les
# Notification (#105) en dérivent via NotificationService.
#
# `actor` est optionnel : certains événements n'ont pas de « qui » (décision
# actée sur #110). `projectable` est le projet parent au sens large, pour le
# filtrage cross-projets du flux Activity.
class ActivityEvent < ApplicationRecord
  belongs_to :actor, class_name: "Member", optional: true
  belongs_to :subject, polymorphic: true
  belongs_to :projectable, polymorphic: true, optional: true

  has_many :notifications, dependent: :destroy

  validates :action, presence: true

  scope :recent_first, -> { order(created_at: :desc) }
end
