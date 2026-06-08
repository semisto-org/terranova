# frozen_string_literal: true

module Academy
  # Message échangé entre un·e participant·e (contact) et l'équipe Semisto au
  # sujet d'une activité (#18 fil support / #41 message → tâche). Un « fil » =
  # tous les messages d'un couple (training, contact). Chaque message entrant
  # (sender = participant) déclenche une tâche « Répondre à … » via le service
  # Academy::ParticipantMessageRouter.
  class ParticipantMessage < ApplicationRecord
    include SoftDeletable
    self.table_name = "academy_participant_messages"

    SENDERS = %w[participant team].freeze

    belongs_to :training, class_name: "Academy::Training", foreign_key: :training_id
    belongs_to :contact
    belongs_to :author_member, class_name: "Member", optional: true

    validates :body, presence: true
    validates :sender, inclusion: { in: SENDERS }

    scope :for_thread, ->(training_id, contact_id) {
      where(training_id: training_id, contact_id: contact_id).order(:created_at)
    }
    scope :chronological, -> { order(:created_at) }

    def from_participant?
      sender == "participant"
    end
  end
end
