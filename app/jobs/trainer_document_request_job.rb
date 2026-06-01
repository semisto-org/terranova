# frozen_string_literal: true

# Envoie, ~24h après la fin d'une session, un email à chacun de ses formateurs
# pour les inviter à déposer leurs documents sur la page de la session.
#
# Planifié quotidiennement (config/recurring.yml). Idempotent : une session
# notifiée porte `trainer_docs_requested_at` et n'est jamais re-traitée.
#
# Fenêtre : sessions terminées entre hier et il y a RECENT_WINDOW jours. La
# borne basse évite, au premier déploiement, d'arroser les formateurs de toutes
# les sessions historiques jamais notifiées.
class TrainerDocumentRequestJob < ApplicationJob
  queue_as :default

  RECENT_WINDOW = 7

  def perform
    sessions_to_notify.find_each do |session|
      next if (session.trainer_ids || []).empty?

      trainers = Contact.where(id: session.trainer_ids).where.not(email: [nil, ""])
      trainers.each do |trainer|
        AcademyMailer.trainer_document_request(session, trainer).deliver_later
      rescue StandardError => e
        # Un formateur problématique (email invalide…) ne doit jamais bloquer
        # l'envoi aux autres ni empêcher le marquage de la session.
        Rails.logger.warn("trainer_document_request failed for contact #{trainer.id}: #{e.message}")
      end

      # Flag posé une seule fois quoi qu'il arrive : best-effort « au plus une
      # fois par formateur » — un rappel non critique ne doit pas se ré-émettre.
      session.update_column(:trainer_docs_requested_at, Time.current)
    end
  end

  private

  def sessions_to_notify
    Academy::TrainingSession
      .where(trainer_docs_requested_at: nil)
      .where("end_date <= ?", Date.current - 1)
      .where("end_date >= ?", Date.current - RECENT_WINDOW)
      .where("jsonb_array_length(trainer_ids) > 0")
  end
end
