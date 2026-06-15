# frozen_string_literal: true

# Envoie, le lendemain (J+1) d'une session terminée, UN SEUL email de demande
# de feedback à chacun·e des inscrit·es (#21/#46). Pas de rappel.
#
# Planifié quotidiennement (config/recurring.yml). Idempotent : une session
# notifiée porte `feedback_requested_at` et n'est jamais re-traitée — même
# pattern que TrainerDocumentRequestJob. La borne basse évite, au premier
# déploiement, d'arroser les inscrit·es de toutes les sessions historiques.
class SessionFeedbackEmailJob < ApplicationJob
  queue_as :default

  RECENT_WINDOW = 7

  def perform
    sessions_to_notify.find_each do |session|
      registrations = session.training.registrations.where.not(contact_email: [nil, ""])
      registrations.each do |registration|
        AcademyMailer.session_feedback_request(session, registration).deliver_later
      rescue StandardError => e
        Rails.logger.warn("session_feedback_request failed for registration #{registration.id}: #{e.message}")
      end

      session.update_column(:feedback_requested_at, Time.current)
    end
  end

  private

  def sessions_to_notify
    Academy::TrainingSession
      .where(feedback_requested_at: nil)
      .where("end_date <= ?", Date.current - 1)
      .where("end_date >= ?", Date.current - RECENT_WINDOW)
  end
end
