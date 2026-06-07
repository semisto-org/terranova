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
        redirect_to my_semisto_path(safe_redirect_path(params[:redirect]))
      rescue ActiveSupport::MessageVerifier::InvalidSignature, ActiveRecord::RecordNotFound
        redirect_to my_semisto_path("/login"), alert: "Lien invalide ou expiré. Veuillez en demander un nouveau."

      end

      # Only allow internal, relative redirect targets — never an absolute or
      # protocol-relative URL (open-redirect guard). Defaults to the portal root.
      def safe_redirect_path(raw)
        path = raw.to_s
        return "/" unless path.start_with?("/") && !path.start_with?("//")
        path
      end

      # ── Directory API ──

      def directory
        contacts = Contact.people_only
          .where(deleted_at: nil, visible_in_directory: true)
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
        permitted = params.permit(:email, :phone, :city, :bio, :latitude, :longitude, :avatar, :visible_in_directory, expertise: [])

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
        trainings = Academy::Training.where(id: accessible_training_ids).includes(:training_type, :sessions)

        render json: {
          trainings: trainings.map { |t| serialize_portal_training(t) }
        }
      end

      def academy_training_detail
        training = find_contact_training!
        return unless training

        documents = training.documents.order(uploaded_at: :desc)
        sessions = training.sessions.order(start_date: :asc)

        render json: serialize_portal_training_detail(
          training, sessions, documents,
          can_upload: uploadable_training_ids.include?(training.id)
        )
      end

      # ── Actus / notifications (#17) : cloche transverse à toutes les
      # activités accessibles au contact. ──
      def announcements
        ids = accessible_training_ids
        items = Academy::Announcement
          .where(training_id: ids)
          .includes(:training)
          .recent_first
          .map do |a|
            {
              id: a.id.to_s,
              trainingId: a.training_id.to_s,
              trainingTitle: a.training&.title,
              title: a.title,
              body: a.body,
              status: a.status,
              toConfirm: a.status == "to_confirm",
              publishedAt: a.published_at&.iso8601
            }
          end
        render json: { items: items }
      end

      # ── Fil support participant ↔ équipe (#18) : le contact ne voit QUE son
      # propre fil pour une activité accessible. ──
      def messages
        training = find_contact_training!
        return unless training

        msgs = Academy::ParticipantMessage
          .for_thread(training.id, current_contact.id)
          .map { |m| serialize_my_message(m) }
        render json: { messages: msgs }
      end

      # Message entrant (#41) : crée le message + une tâche « Répondre à … »
      # assignée au coordinateur, dans la même transaction.
      def create_message
        training = find_contact_training!
        return unless training

        body = params.require(:body).to_s.strip
        return render json: { error: "Message vide" }, status: :unprocessable_entity if body.blank?

        message = Academy::ParticipantMessageRouter.record_participant_message(
          training: training, contact: current_contact, body: body
        )
        render json: serialize_my_message(message), status: :created
      end

      # ── Feedback de session (#21/#46) ──
      def create_feedback
        training = find_contact_training!
        return unless training

        session = training.sessions.find(params.require(:session_id))
        feedback = session.feedbacks.new(
          contact_id: current_contact.id,
          rating: params[:rating].presence,
          comment: params[:comment].to_s,
          anonymous: ActiveModel::Type::Boolean.new.cast(params[:anonymous]) || false
        )
        if feedback.save
          render json: { id: feedback.id.to_s, rating: feedback.rating, anonymous: feedback.anonymous }, status: :created
        else
          render json: { errors: feedback.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # ── Carpooling API ──

      def carpooling
        registration = find_contact_registration!
        return unless registration

        all_registrations = Academy::TrainingRegistration
          .where(training_id: registration.training_id, deleted_at: nil)
          .where.not(carpooling: "none")

        drivers = all_registrations.where(carpooling: "offering").where.not(id: registration.id)
        seekers = all_registrations.where(carpooling: "seeking").where.not(id: registration.id)

        render json: {
          myRegistration: {
            carpooling: registration.carpooling,
            departureCity: registration.departure_city,
            departurePostalCode: registration.departure_postal_code,
            departureCountry: registration.departure_country
          },
          drivers: drivers.map { |r| serialize_carpooling_participant(r) },
          seekers: seekers.map { |r| serialize_carpooling_participant(r) }
        }
      end

      # Privacy-preserving relay: a participant sends a message to another
      # participant of the same training. We email the target with Reply-To set
      # to the sender, so the reply lands directly in the sender's inbox — no
      # address is ever revealed on the page or in the payload.
      def contact_carpooler
        sender = find_contact_registration!
        return unless sender

        target = Academy::TrainingRegistration
          .where(training_id: sender.training_id, deleted_at: nil)
          .where.not(id: sender.id)
          .find_by(id: params[:to_registration_id])

        unless target&.contact_email.present?
          render json: { error: "Participant introuvable" }, status: :not_found
          return
        end

        message = params[:message].to_s.strip
        if message.blank?
          render json: { error: "Le message ne peut pas être vide" }, status: :unprocessable_entity
          return
        end

        AcademyMailer.carpooling_message(
          from_registration: sender,
          to_registration: target,
          message: message
        ).deliver_later

        render json: { status: "ok" }
      end

      def update_carpooling
        registration = find_contact_registration!
        return unless registration

        permitted = params.permit(:carpooling, :departure_city, :departure_postal_code, :departure_country)

        if permitted[:carpooling].present? &&
           !Academy::TrainingRegistration::CARPOOLING_OPTIONS.include?(permitted[:carpooling])
          render json: { error: "Option de covoiturage invalide" }, status: :unprocessable_entity
          return
        end

        registration.update!(permitted.to_h.compact)
        render json: {
          carpooling: registration.carpooling,
          departureCity: registration.departure_city,
          departurePostalCode: registration.departure_postal_code,
          departureCountry: registration.departure_country
        }
      end

      # ── Documents API (trainer upload / delete) ──

      MAX_DOCUMENT_BYTES = 200 * 1024 * 1024 # 200 Mo

      # POST /api/v1/my/academy/:training_id/documents
      # Mirror of admin Api::V1::AcademyController#create_document, but:
      #  - gated on the upload right (in access_contact_ids AND not registered)
      #  - forces uploaded_by = "trainer"
      #  - enforces a 200 Mo per-file server-side cap (422 on overflow)
      #  - validates session_id (if given) belongs to the training
      #  - enqueues PDF compression for PDFs and one Slack ping for the deposit
      # Supports one or many files in a single request (params[:files][]),
      # while staying compatible with a single params[:file].
      def create_document
        training = find_uploadable_training!
        return unless training

        files = upload_files
        if files.empty?
          render json: { error: "Aucun fichier fourni." }, status: :unprocessable_entity
          return
        end

        session = resolve_upload_session(training)
        return if performed? # resolve_upload_session rendered an error

        oversized = files.find { |f| f.size.to_i > MAX_DOCUMENT_BYTES }
        if oversized
          render json: {
            error: "Le fichier « #{oversized.original_filename} » dépasse la limite de 200 Mo."
          }, status: :unprocessable_entity
          return
        end

        created = []
        Academy::TrainingDocument.transaction do
          files.each do |uploaded|
            document = training.documents.build(
              name: document_name_for(uploaded),
              session_id: session&.id,
              uploaded_by: "trainer",
              uploaded_at: Time.current,
              url: nil
            )
            document.file.attach(uploaded)
            document.save!
            created << document
          end
        end

        # Async, post-commit: compress each PDF, and send a single Slack ping.
        created.each do |document|
          if document.file.attached? && document.file.content_type == "application/pdf"
            PdfCompressionJob.perform_later(document.id)
          end
        end
        enqueue_slack_notification(training, session, created.size)

        render json: { documents: created.map { |d| serialize_portal_document(d) } }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.join(", ") }, status: :unprocessable_entity
      end

      # DELETE /api/v1/my/academy/:training_id/documents/:document_id
      # Any contact with the upload right on the training may delete ANY of its
      # documents (team, other trainers, own) — soft delete. A document from a
      # training the contact has no right on is rejected.
      def destroy_document
        training = find_uploadable_training!
        return unless training

        document = training.documents.find_by(id: params[:document_id])
        unless document
          render json: { error: "Document introuvable" }, status: :not_found
          return
        end

        document.soft_delete!
        head :no_content
      end

      # ── Session photo album link (trainer set / clear) ──

      # PATCH /api/v1/my/academy/:training_id/sessions/:session_id/photo-album
      # Gated on the same upload right as documents (access grant AND not
      # registered). Sets — or clears, on a blank value — the Google Photos
      # album link of one session. A session_id not belonging to the training
      # is rejected (422), consistent with resolve_upload_session.
      def update_session_photo_album
        training = find_uploadable_training!
        return unless training

        session = training.sessions.find_by(id: params[:session_id])
        unless session
          render json: { error: "Session invalide pour cette formation." }, status: :unprocessable_entity
          return
        end

        if session.update(photo_album_url: params[:photo_album_url].to_s.strip)
          render json: { session: serialize_portal_session(session) }
        else
          render json: { error: session.errors.full_messages.join(", ") }, status: :unprocessable_entity
        end
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
        render json: { error: "Non autorisé" }, status: :unauthorized unless current_contact
      end

      def contact_registrations
        Academy::TrainingRegistration
          .where("contact_id = :id OR LOWER(contact_email) = :email",
                 id: current_contact.id,
                 email: current_contact.email&.downcase)
      end

      # Training IDs where this contact was explicitly granted access (formateurs,
      # coordinateurs…) without being a registered participant.
      def access_granted_training_ids
        Academy::Training
          .where(deleted_at: nil)
          .where("access_contact_ids @> ?", [current_contact.id.to_s].to_json)
          .pluck(:id)
      end

      # All trainings this contact may view in the portal: registered participations
      # plus explicit access grants.
      def accessible_training_ids
        (contact_registrations.pluck(:training_id) + access_granted_training_ids).uniq
      end

      # Trainings the contact may upload to / delete documents from: explicit
      # access grant AND not a registered participant (D3). access_granted_training_ids
      # already uses the jsonb string-id containment match; subtracting the
      # registration ids enforces the "et pas inscrit" rule.
      def uploadable_training_ids
        access_granted_training_ids - contact_registrations.pluck(:training_id)
      end

      # Loads the target training for write actions, or renders the access error
      # and returns nil. 404 (not 403) keeps the portal opaque about which
      # trainings exist — consistent with find_contact_training!.
      def find_uploadable_training!
        unless uploadable_training_ids.include?(params[:training_id].to_i)
          render json: { error: "Formation introuvable" }, status: :not_found
          return nil
        end
        Academy::Training.find(params[:training_id])
      end

      # Normalizes single- and multi-file uploads to an array of uploaded files.
      def upload_files
        if params[:files].present?
          Array(params[:files]).compact
        elsif params[:file].present?
          [params[:file]]
        else
          []
        end
      end

      # Per-document display name: explicit name when provided, else the filename.
      def document_name_for(uploaded)
        provided = params[:name].to_s.strip
        return provided if provided.present?
        uploaded.original_filename.to_s
      end

      # Resolves the chosen session for the upload, or nil for "Général".
      # A session_id that doesn't belong to the training is rejected (renders 422).
      def resolve_upload_session(training)
        session_id = params[:session_id].presence
        return nil if session_id.blank?

        session = training.sessions.find_by(id: session_id)
        unless session
          render json: { error: "Session invalide pour cette formation." }, status: :unprocessable_entity
          return nil
        end
        session
      end

      # Enqueues the (best-effort, isolated) Slack ping summarizing the deposit.
      # Building the message here keeps the job a plain string consumer.
      def enqueue_slack_notification(training, session, count)
        session_label = session ? session.start_date.to_date.strftime("%d/%m") : "Général"
        link = "#{request.base_url}#{my_semisto_training_link(training)}"
        text = "📎 #{current_contact.display_name} a déposé #{count} document(s) " \
               "pour #{training.title} — #{session_label} · #{link}"
        SlackNotificationJob.perform_later(text)
      end

      # Path to the training detail page in My Semisto, honoring the domain prefix.
      def my_semisto_training_link(training)
        my_semisto_path("/academy/#{training.id}")
      end

      def find_contact_registration!
        registration = contact_registrations.find_by(training_id: params[:training_id])
        unless registration
          render json: { error: "Inscription introuvable" }, status: :not_found
          return nil
        end
        registration
      end

      # No contact details are exposed — only the relay target id (registration),
      # first name and departure location. Contacting goes through #contact_carpooler.
      def serialize_carpooling_participant(registration)
        {
          id: registration.id.to_s,
          firstName: registration.contact_name.to_s.split(" ").first,
          departureCity: registration.departure_city,
          departurePostalCode: registration.departure_postal_code,
          departureCountry: registration.departure_country,
          contactable: registration.contact_email.present?
        }
      end

      def find_contact_training!
        unless accessible_training_ids.include?(params[:training_id].to_i)
          render json: { error: "Formation introuvable" }, status: :not_found
          return nil
        end
        Academy::Training.includes(:training_type, :sessions, :documents).find(params[:training_id])
      end

      def serialize_my_message(message)
        {
          id: message.id.to_s,
          body: message.body,
          # Du point de vue du participant : ses messages = "me", l'équipe = "team".
          from: message.sender == "participant" ? "me" : "team",
          createdAt: message.created_at.iso8601
        }
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
          avatarUrl: contact_avatar_url(contact),
          latitude: contact.latitude&.to_f,
          longitude: contact.longitude&.to_f
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
          latitude: contact.latitude&.to_f,
          longitude: contact.longitude&.to_f,
          region: contact.region.to_s,
          address: contact.address.to_s,
          linkedinUrl: contact.linkedin_url.to_s,
          visibleInDirectory: contact.visible_in_directory,
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

      def serialize_portal_training_detail(training, sessions, documents, can_upload: false)
        location_ids = sessions.flat_map(&:location_ids).uniq
        locations_by_id = Academy::TrainingLocation.where(id: location_ids).index_by { |l| l.id.to_s }

        {
          id: training.id.to_s,
          title: training.title,
          status: training.status,
          description: training.description,
          trainingType: training.training_type&.name,
          canUpload: can_upload,
          sessions: sessions.map { |s| serialize_portal_session(s, locations_by_id) },
          documents: documents.map { |d| serialize_portal_document(d) }
        }
      end

      def serialize_portal_session(session, locations_by_id = {})
        {
          id: session.id.to_s,
          startDate: session.start_date.iso8601,
          endDate: session.end_date.iso8601,
          topic: session.topic,
          description: session.description,
          photoAlbumUrl: session.photo_album_url.presence,
          meetingPoint: session.meeting_point.presence,
          meetingTime: session.meeting_time.presence,
          mealsInfo: session.meals_info.presence,
          accommodationInfo: session.accommodation_info.presence,
          packingList: session.packing_list || [],
          locations: (session.location_ids || []).filter_map { |id|
            loc = locations_by_id[id.to_s]
            next unless loc
            { id: loc.id.to_s, name: loc.name, address: loc.address }
          }
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
