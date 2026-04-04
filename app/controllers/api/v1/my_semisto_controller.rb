# frozen_string_literal: true

module Api
  module V1
    class MySemistoController < ApplicationController
      include MySemistoRouting


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
        redirect_to my_semisto_path("/")
      rescue ActiveSupport::MessageVerifier::InvalidSignature, ActiveRecord::RecordNotFound
        redirect_to my_semisto_path("/login"), alert: "Lien invalide ou expire. Veuillez en demander un nouveau."

      end

      # ── Directory API ──

      def directory
        contacts = Contact.people_only
          .where(deleted_at: nil)
          .where.not(email: [nil, ""])
          .order(:name)

        render json: {
          contacts: contacts.map { |c| serialize_directory_contact(c) }
        }
      end

      def directory_contact
        contact = Contact.people_only.where(deleted_at: nil).find(params[:id])

        # Find trainings linked to this contact
        registrations = Academy::TrainingRegistration
          .where("contact_id = :id OR LOWER(contact_email) = :email",
                 id: contact.id,
                 email: contact.email&.downcase)
          .includes(training: [:training_type, :sessions])

        training_ids = registrations.map(&:training_id).uniq
        trainings = Academy::Training.where(id: training_ids).includes(:training_type, :sessions)

        render json: {
          contact: serialize_directory_contact_detail(contact),
          trainings: trainings.map { |t| serialize_directory_training(t) }
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Contact introuvable" }, status: :not_found
      end

      # ── Profile API ──

      def profile
        render json: { contact: serialize_directory_contact_detail(current_contact) }
      end

      def update_profile
        permitted = params.permit(:email, :phone, :city, :bio, :avatar, expertise: [])

        if permitted[:avatar].present?
          current_contact.avatar_image.attach(permitted[:avatar])
        end

        updates = permitted.except(:avatar).to_h
        updates.delete_if { |_, v| v.nil? }

        if current_contact.update(updates)
          render json: { contact: serialize_directory_contact_detail(current_contact.reload) }
        else
          render json: { error: current_contact.errors.full_messages.join(", ") }, status: :unprocessable_entity
        end
      end

      def remove_avatar
        current_contact.avatar_image.purge if current_contact.avatar_image.attached?
        render json: { status: "ok" }
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

      def contact_avatar_url(contact)
        return nil unless contact.avatar_image.attached?
        Rails.application.routes.url_helpers.rails_blob_url(contact.avatar_image, only_path: true)
      end

      def serialize_directory_contact(contact)
        {
          id: contact.id.to_s,
          name: contact.display_name,
          email: contact.email.to_s,
          phone: contact.phone.to_s,
          city: contact.city.to_s,
          bio: contact.bio.to_s,
          expertise: contact.expertise || [],
          avatarUrl: contact_avatar_url(contact)
        }
      end

      def serialize_directory_contact_detail(contact)
        {
          id: contact.id.to_s,
          name: contact.display_name,
          email: contact.email.to_s,
          phone: contact.phone.to_s,
          city: contact.city.to_s,
          bio: contact.bio.to_s,
          expertise: contact.expertise || [],
          avatarUrl: contact_avatar_url(contact),
          region: contact.region.to_s,
          address: contact.address.to_s,
          linkedinUrl: contact.linkedin_url.to_s,
          createdAt: contact.created_at.iso8601
        }
      end

      def serialize_directory_training(training)
        sessions = training.sessions.sort_by(&:start_date)
        {
          id: training.id.to_s,
          title: training.title,
          status: training.status,
          trainingType: training.training_type&.name,
          trainingTypeColor: training.training_type&.color,
          startDate: sessions.first&.start_date&.iso8601,
          endDate: sessions.last&.end_date&.iso8601
        }
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
          byteSize: doc.file.attached? ? doc.file.byte_size : nil,
          contentType: doc.file.attached? ? doc.file.content_type : nil,
          sessionId: doc.session_id&.to_s,
          uploadedAt: doc.uploaded_at.iso8601
        }
      end
    end
  end
end
