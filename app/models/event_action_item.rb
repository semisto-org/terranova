# frozen_string_literal: true

# Point d'action d'un compte-rendu de réunion (#47) — substrat « de la réunion
# aux tâches ». Saisi à l'état `proposed` ; le coordinateur le passe à
# `validated`, ce qui crée une Task assignée rattachée à la réunion et au projet
# (cf. Meetings::ActionItemValidator). La couche UI (saisie du compte-rendu +
# vue « en attente de validation ») est suivie dans #47b.
class EventActionItem < ApplicationRecord
  STATUSES = %w[proposed validated].freeze

  belongs_to :event
  belongs_to :assignee, class_name: "Member", optional: true
  belongs_to :task, optional: true
  belongs_to :created_by, class_name: "Member", optional: true

  validates :description, presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :proposed, -> { where(status: "proposed") }
  scope :ordered, -> { order(:position, :created_at) }

  def validated?
    status == "validated"
  end
end
