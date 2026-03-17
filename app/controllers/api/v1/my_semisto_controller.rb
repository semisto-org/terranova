# frozen_string_literal: true

module Api
  module V1
    class MySemistoController < ApplicationController
      skip_forgery_protection
      skip_before_action :track_member_activity

      before_action :require_contact_authentication, except: [:request_magic_link, :verify]

      # ── Auth API ──

      def request_magic_link
        email = params[:email].to_s.strip.downcase
        contact = Contact.find_by("LOWER(email) = ?", email)

        ContactMailer.magic_link(contact).deliver_later if contact

        # Always return 200 (anti-enumeration)
        render json: { status: "ok" }
      end

      def verify
        token = params[:token].to_s
        data = verify_contact_token(token)
        contact = Contact.find(data[:contact_id] || data["contact_id"])
        session[:contact_id] = contact.id
        redirect_to "/my"
      rescue ActiveSupport::MessageVerifier::InvalidSignature, ActiveRecord::RecordNotFound
        redirect_to "/my/login", alert: "Lien invalide ou expire. Veuillez en demander un nouveau."
      end

      # ── Academy API ──

      def academy_trainings
        registrations = contact_registrations.includes(training: [:training_type, :sessions])
        training_ids = registrations.map(&:training_id).uniq
        trainings = Academy::Training.where(id: training_ids).includes(:training_type, :sessions)

        render json: {
          trainings: trainings.map { |t| serialize_portal_training(t) }
        }
      end

      def academy_training_detail
        training = find_contact_training!
        return unless training

        documents = training.documents.order(uploaded_at: :desc)
        sessions = training.sessions.order(start_date: :asc)

        render json: serialize_portal_training_detail(training, sessions, documents)
      end

      private

      def verify_contact_token(token)
        verifier = Rails.application.message_verifier(:contact_login)
        begin
          verifier.verify(token, purpose: :contact_login)
        rescue ActiveSupport::MessageVerifier::InvalidSignature
          verifier.verify(token, purpose: :contact_impersonation)
        end
      end

      def current_contact
        @current_contact ||= Contact.find_by(id: session[:contact_id]) if session[:contact_id]
      end

      def require_contact_authentication
        render json: { error: "Non autorise" }, status: :unauthorized unless current_contact
      end

      def contact_registrations
        Academy::TrainingRegistration
          .where("contact_id = :id OR LOWER(contact_email) = :email",
                 id: current_contact.id,
                 email: current_contact.email&.downcase)
      end

      def find_contact_training!
        registration = contact_registrations.find_by(training_id: params[:training_id])
        unless registration
          render json: { error: "Formation introuvable" }, status: :not_found
          return nil
        end
        Academy::Training.includes(:training_type, :sessions, :documents).find(registration.training_id)
      end

      def serialize_portal_training(training)
        sessions = training.sessions.sort_by(&:start_date)
        {
          id: training.id.to_s,
          title: training.title,
          status: training.status,
          description: training.description,
          trainingType: training.training_type&.name,
          startDate: sessions.first&.start_date&.iso8601,
          endDate: sessions.last&.end_date&.iso8601,
          sessionCount: sessions.size,
          documentCount: training.documents.size
        }
      end

      def serialize_portal_training_detail(training, sessions, documents)
        {
          id: training.id.to_s,
          title: training.title,
          status: training.status,
          description: training.description,
          trainingType: training.training_type&.name,
          sessions: sessions.map { |s| serialize_portal_session(s) },
          documents: documents.map { |d| serialize_portal_document(d) }
        }
      end

      def serialize_portal_session(session)
        {
          id: session.id.to_s,
          startDate: session.start_date.iso8601,
          endDate: session.end_date.iso8601,
          topic: session.topic,
          description: session.description
        }
      end

      def serialize_portal_document(doc)
        download_url = if doc.file.attached?
          Rails.application.routes.url_helpers.rails_blob_url(doc.file, only_path: true)
        else
          doc.url
        end

        {
          id: doc.id.to_s,
          name: doc.name,
          url: download_url,
          filename: doc.file.attached? ? doc.file.filename.to_s : nil,
          sessionId: doc.session_id&.to_s,
          uploadedAt: doc.uploaded_at.iso8601
        }
      end
    end
  end
end
