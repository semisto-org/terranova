# frozen_string_literal: true

module Academy
  # Enregistre un message entrant d'un·e participant·e et crée, dans la même
  # transaction, une tâche « Répondre à … » assignée au coordinateur de
  # l'activité (#41/#18). Un message entrant = exactement une tâche.
  class ParticipantMessageRouter
    DEFAULT_LIST_NAME = "À faire"

    def self.record_participant_message(training:, contact:, body:)
      new(training).record_participant_message(contact, body)
    end

    def initialize(training)
      @training = training
    end

    def record_participant_message(contact, body)
      message = nil
      Academy::ParticipantMessage.transaction do
        message = @training.participant_messages.create!(
          contact: contact, body: body, sender: "participant"
        )
        create_followup_task(contact, message)
      end
      message
    end

    private

    def create_followup_task(contact, message)
      attrs = {
        name: "Répondre à #{contact.display_name}",
        description: message.body.to_s.truncate(280),
        status: "pending",
        due_date: Date.current
      }
      coordinator_id = @training.coordinator_member_id
      attrs[:assignee_id] = coordinator_id if coordinator_id.present?
      default_list.tasks.create!(attrs)
    end

    def default_list
      @training.unified_task_lists.order(:position, :created_at).first ||
        @training.unified_task_lists.create!(name: DEFAULT_LIST_NAME, position: 0)
    end
  end
end
