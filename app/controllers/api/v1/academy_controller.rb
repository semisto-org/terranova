module Api
  module V1
    class AcademyController < BaseController
      skip_before_action :require_authentication, only: [:index]
      before_action :require_effective_member, except: [:index]

      def index
        render json: academy_payload
      end

      def create_training_type
        item = Academy::TrainingType.create!(training_type_params)
        render json: serialize_training_type(item), status: :created
      end

      def update_training_type
        item = Academy::TrainingType.find(params.require(:training_type_id))
        item.update!(training_type_params)
        render json: serialize_training_type(item)
      end

      def destroy_training_type
        Academy::TrainingType.find(params.require(:training_type_id)).soft_delete!
        head :no_content
      end

      def create_location
        item = Academy::TrainingLocation.create!(location_params)
        render json: serialize_location(item), status: :created
      end

      def update_location
        item = Academy::TrainingLocation.find(params.require(:location_id))
        item.update!(location_params)
        render json: serialize_location(item)
      end

      def destroy_location
        Academy::TrainingLocation.find(params.require(:location_id)).soft_delete!
        head :no_content
      end

      def create_training
        training_type = Academy::TrainingType.find(params.require(:training_type_id))
        item = Academy::Training.new(training_params)
        item.training_type = training_type
        item.status = 'draft' if item.status.blank?
        item.checklist_items = training_type.checklist_template if item.checklist_items.blank?
        item.save!

        render json: serialize_training(item), status: :created
      end

      def update_training
        item = Academy::Training.find(params.require(:training_id))
        item.update!(training_update_params)
        render json: serialize_training(item)
      end

      def destroy_training
        Academy::Training.find(params.require(:training_id)).soft_delete!
        head :no_content
      end

      def update_training_status
        item = Academy::Training.find(params.require(:training_id))
        item.update!(status: params.require(:status))
        render json: serialize_training(item)
      end

      def create_session
        training = Academy::Training.find(params.require(:training_id))
        item = training.sessions.create!(session_params)
        render json: serialize_session(item), status: :created
      end

      def update_session
        item = Academy::TrainingSession.find(params.require(:session_id))
        item.update!(session_params)
        render json: serialize_session(item)
      end

      def destroy_session
        Academy::TrainingSession.find(params.require(:session_id)).soft_delete!
        head :no_content
      end

      def create_registration
        training = Academy::Training.find(params.require(:training_id))
        item = training.registrations.create!(registration_params.merge(registered_at: Time.current))
        render json: serialize_registration(item), status: :created
      end

      def update_registration
        item = Academy::TrainingRegistration.find(params.require(:registration_id))
        item.update!(registration_update_params)
        render json: serialize_registration(item)
      end

      def destroy_registration
        Academy::TrainingRegistration.find(params.require(:registration_id)).soft_delete!
        head :no_content
      end

      def update_payment_status
        item = Academy::TrainingRegistration.find(params.require(:registration_id))
        item.update!(payment_status: params.require(:status), amount_paid: params[:amount_paid] || item.amount_paid)
        render json: serialize_registration(item)
      end

      def mark_attendance
        item = Academy::TrainingAttendance.find_or_initialize_by(
          registration_id: params.require(:registration_id),
          session_id: params.require(:session_id)
        )
        item.assign_attributes(is_present: params[:is_present], note: params[:note].to_s)
        item.save!

        render json: serialize_attendance(item)
      end

      def create_document
        training = Academy::Training.find(params.require(:training_id))
        item = training.documents.build(
          document_params.except(:file).merge(uploaded_at: Time.current, url: nil)
        )
        item.file.attach(params[:file]) if params[:file].present?
        item.save!
        render json: serialize_document(item), status: :created
      end

      def destroy_document
        Academy::TrainingDocument.find(params.require(:document_id)).soft_delete!
        head :no_content
      end

      def toggle_checklist_item
        training = Academy::Training.find(params.require(:training_id))
        index = params.require(:item_index).to_i
        checked = training.checked_items || []

        if checked.include?(index)
          checked -= [index]
        else
          checked << index
        end

        training.update!(checked_items: checked.sort)
        render json: serialize_training(training)
      end

      def add_checklist_item
        training = Academy::Training.find(params.require(:training_id))
        training.update!(checklist_items: training.checklist_items + [params.require(:item)])
        render json: serialize_training(training)
      end

      def remove_checklist_item
        training = Academy::Training.find(params.require(:training_id))
        index = params.require(:item_index).to_i
        items = training.checklist_items.dup
        items.delete_at(index)
        checked = training.checked_items.map(&:to_i).reject { |i| i == index }.map { |i| i > index ? i - 1 : i }
        training.update!(checklist_items: items, checked_items: checked)
        render json: serialize_training(training)
      end

      def create_expense
        training = Academy::Training.find(params.require(:training_id))
        item = training.expenses.create!(expense_params)
        item.document.attach(params[:document]) if params[:document].present?
        render json: serialize_expense(item.reload), status: :created
      end

      def update_expense
        item = Expense.find(params.require(:expense_id))
        item.update!(expense_params)
        item.document.attach(params[:document]) if params[:document].present?
        render json: serialize_expense(item.reload)
      end

      def destroy_expense
        Expense.find(params.require(:expense_id)).soft_delete!
        head :no_content
      end

      def create_idea_note
        item = Academy::IdeaNote.create!(idea_note_params)
        render json: serialize_idea_note(item), status: :created
      end

      def update_idea_note
        item = Academy::IdeaNote.find(params.require(:note_id))
        item.update!(idea_note_params)
        render json: serialize_idea_note(item)
      end

      def destroy_idea_note
        Academy::IdeaNote.find(params.require(:note_id)).soft_delete!
        head :no_content
      end

      def calendar
        trainings = Academy::Training.includes(:sessions).order(updated_at: :desc)
        render json: trainings.map { |item| serialize_calendar_entry(item) }
      end

      def reporting
        trainings = Academy::Training.includes(:registrations, :expenses, :training_type)
        revenue_incl_vat = trainings.sum { |item| item.registrations.sum(&:amount_paid).to_f }
        revenue = trainings.sum do |item|
          item.registrations.sum do |r|
            vr = item.vat_rate.to_f
            vr > 0 ? (r.amount_paid.to_f / (1 + vr / 100.0)).round(2) : r.amount_paid.to_f
          end
        end
        expenses = trainings.sum { |item| item.expenses.sum(&:amount_excl_vat).to_f }
        total_participants = trainings.sum { |item| item.registrations.size }

        by_status = Academy::Training::STATUSES.index_with do |status|
          trainings.count { |t| t.status == status }
        end

        training_ids = trainings.map(&:id)
        expenses_by_category = Expense.where(training_id: training_ids).where.not(category: nil).group(:category).sum(:amount_excl_vat).transform_values(&:to_f)

        fill_rates = trainings.filter_map do |t|
          next if t.max_participants.to_i.zero?
          (t.registrations.size.to_f / t.max_participants * 100).round(1)
        end
        average_fill_rate = fill_rates.any? ? (fill_rates.sum / fill_rates.size).round(1) : 0

        fill_rates_by_type = trainings.group_by { |t| t.training_type&.name || "Sans type" }.filter_map do |type_name, type_trainings|
          rates = type_trainings.filter_map do |t|
            next if t.max_participants.to_i.zero?
            (t.registrations.size.to_f / t.max_participants * 100).round(1)
          end
          next if rates.empty?
          { name: type_name, fillRate: (rates.sum / rates.size).round(1), trainingsCount: type_trainings.size }
        end.sort_by { |entry| -entry[:fillRate] }

        render json: {
          trainingsCount: trainings.size,
          completedTrainings: trainings.count { |item| item.status == 'completed' },
          totalRevenue: revenue,
          totalRevenueInclVat: revenue_incl_vat,
          totalExpenses: expenses,
          profitability: revenue - expenses,
          byStatus: by_status,
          expensesByCategory: expenses_by_category,
          totalParticipants: total_participants,
          averageFillRate: average_fill_rate,
          fillRatesByType: fill_rates_by_type
        }
      end

      private

      def academy_payload
        training_types = Academy::TrainingType.order(:name)
        trainings = Academy::Training.includes(:album).order(updated_at: :desc)
        sessions = Academy::TrainingSession.order(start_date: :asc)
        locations = Academy::TrainingLocation.order(:name)
        registrations = Academy::TrainingRegistration.order(registered_at: :desc)
        attendances = Academy::TrainingAttendance.where(registration_id: Academy::TrainingRegistration.select(:id)).order(updated_at: :desc)
        documents = Academy::TrainingDocument.order(uploaded_at: :desc)
        expenses = Expense.where.not(training_id: nil).order(invoice_date: :desc)
        idea_notes = Academy::IdeaNote.order(created_at: :desc)
        members = Member.order(:first_name, :last_name)

        {
          trainingTypes: training_types.map { |item| serialize_training_type(item) },
          trainings: trainings.map { |item| serialize_training(item) },
          trainingSessions: sessions.map { |item| serialize_session(item) },
          trainingLocations: locations.map { |item| serialize_location(item) },
          trainingRegistrations: registrations.map { |item| serialize_registration(item) },
          trainingAttendances: attendances.map { |item| serialize_attendance(item) },
          trainingDocuments: documents.map { |item| serialize_document(item) },
          trainingExpenses: expenses.map { |item| serialize_expense(item) },
          ideaNotes: idea_notes.map { |item| serialize_idea_note(item) },
          members: members.map { |item| serialize_member(item) },
          stats: build_stats(trainings)
        }
      end

      def training_type_params
        params.permit(:name, :description, checklist_template: [], photo_gallery: [], trainer_ids: [])
      end

      def location_params
        params.permit(:name, :address, :description, :capacity, :has_accommodation, :latitude, :longitude, photo_gallery: [], compatible_training_type_ids: [])
      end

      def training_params
        params.permit(:title, :status, :price, :deposit_amount, :vat_rate, :max_participants, :requires_accommodation, :description, :coordinator_note, checklist_items: [], checked_items: [])
      end

      def training_update_params
        params.permit(:title, :status, :price, :deposit_amount, :vat_rate, :max_participants, :requires_accommodation, :description, :coordinator_note, checklist_items: [], checked_items: [])
      end

      def session_params
        params.permit(:start_date, :end_date, :description, :topic, location_ids: [], trainer_ids: [], assistant_ids: [])
      end

      def registration_params
        params.permit(:contact_id, :contact_name, :contact_email, :phone, :departure_city, :departure_postal_code, :departure_country, :carpooling, :amount_paid, :payment_status, :internal_note)
      end

      def registration_update_params
        params.permit(:contact_name, :contact_email, :phone, :departure_city, :departure_postal_code, :departure_country, :carpooling, :amount_paid, :payment_status, :internal_note)
      end

      def document_params
        params.permit(:name, :url, :uploaded_by, :file)
      end

      def expense_params
        params.permit(
          :supplier, :supplier_contact_id, :status, :invoice_date, :category, :expense_type, :billing_zone,
          :payment_date, :payment_type, :amount_excl_vat, :vat_rate,
          :vat_6, :vat_12, :vat_21, :total_incl_vat, :eu_vat_rate, :eu_vat_amount,
          :paid_by, :reimbursed, :reimbursement_date, :billable_to_client, :rebilling_status,
          :name, :notes, :training_id, :design_project_id,
          poles: []
        )
      end

      def idea_note_params
        params.permit(:category, :title, :content, tags: [])
      end

      def serialize_training_type(item)
        {
          id: item.id.to_s,
          name: item.name,
          description: item.description,
          checklistTemplate: item.checklist_template,
          photoGallery: item.photo_gallery,
          trainerIds: item.trainer_ids,
          createdAt: item.created_at.iso8601
        }
      end

      def serialize_location(item)
        {
          id: item.id.to_s,
          name: item.name,
          address: item.address,
          description: item.description,
          photoGallery: item.photo_gallery,
          compatibleTrainingTypeIds: item.compatible_training_type_ids,
          capacity: item.capacity,
          hasAccommodation: item.has_accommodation,
          latitude: item.latitude.to_f,
          longitude: item.longitude.to_f,
          createdAt: item.created_at.iso8601
        }
      end

      def serialize_training(item)
        {
          id: item.id.to_s,
          trainingTypeId: item.training_type_id.to_s,
          title: item.title,
          status: item.status,
          price: item.price.to_f,
          depositAmount: item.deposit_amount.to_f,
          vatRate: item.vat_rate.to_f,
          priceExclVat: item.price_excl_vat,
          maxParticipants: item.max_participants,
          requiresAccommodation: item.requires_accommodation,
          description: item.description,
          coordinatorNote: item.coordinator_note,
          checklistItems: item.checklist_items,
          checkedItems: item.checked_items,
          album: item.album ? serialize_training_album(item.album) : nil,
          createdAt: item.created_at.iso8601,
          updatedAt: item.updated_at.iso8601
        }
      end

      def serialize_training_album(album)
        {
          id: album.id.to_s,
          title: album.title,
          mediaCount: album.media_count
        }
      end

      def serialize_session(item)
        {
          id: item.id.to_s,
          trainingId: item.training_id.to_s,
          startDate: item.start_date.iso8601,
          endDate: item.end_date.iso8601,
          locationIds: item.location_ids,
          trainerIds: item.trainer_ids,
          assistantIds: item.assistant_ids,
          description: item.description,
          topic: item.topic
        }
      end

      def serialize_registration(item)
        {
          id: item.id.to_s,
          trainingId: item.training_id.to_s,
          contactId: item.contact_id,
          contactName: item.contact_name,
          contactEmail: item.contact_email,
          phone: item.phone,
          departureCity: item.departure_city,
          departurePostalCode: item.departure_postal_code,
          departureCountry: item.departure_country,
          carpooling: item.carpooling,
          amountPaid: item.amount_paid.to_f,
          paymentAmount: item.payment_amount.to_f,
          paymentStatus: item.payment_status,
          stripePaymentIntentId: item.stripe_payment_intent_id,
          internalNote: item.internal_note,
          registeredAt: item.registered_at.iso8601
        }
      end

      def serialize_attendance(item)
        {
          id: item.id.to_s,
          registrationId: item.registration_id.to_s,
          sessionId: item.session_id.to_s,
          isPresent: item.is_present,
          note: item.note
        }
      end

      def serialize_document(item)
        download_url = if item.file.attached?
          Rails.application.routes.url_helpers.rails_blob_url(item.file, only_path: true)
        else
          item.url
        end
        {
          id: item.id.to_s,
          trainingId: item.training_id.to_s,
          name: item.name,
          url: download_url,
          filename: item.file.attached? ? item.file.filename.to_s : nil,
          uploadedAt: item.uploaded_at.iso8601,
          uploadedBy: item.uploaded_by
        }
      end

      def serialize_expense(item)
        doc_url = item.document.attached? ? Rails.application.routes.url_helpers.rails_blob_url(item.document) : nil
        {
          id: item.id.to_s,
          trainingId: item.training_id&.to_s,
          designProjectId: item.design_project_id&.to_s,
          supplier: item.supplier_display_name,
          supplierContactId: item.supplier_contact_id&.to_s,
          status: item.status,
          invoiceDate: item.invoice_date&.iso8601,
          category: item.category,
          expenseType: item.expense_type,
          billingZone: item.billing_zone,
          paymentDate: item.payment_date&.iso8601,
          paymentType: item.payment_type,
          amountExclVat: item.amount_excl_vat.to_f,
          vatRate: item.vat_rate,
          vat6: item.vat_6.to_f,
          vat12: item.vat_12.to_f,
          vat21: item.vat_21.to_f,
          totalInclVat: item.total_incl_vat.to_f,
          euVatRate: item.eu_vat_rate,
          euVatAmount: item.eu_vat_amount.to_f,
          paidBy: item.paid_by,
          reimbursed: item.reimbursed,
          reimbursementDate: item.reimbursement_date&.iso8601,
          billableToClient: item.billable_to_client,
          rebillingStatus: item.rebilling_status,
          name: item.name,
          notes: item.notes,
          poles: item.poles || [],
          documentUrl: doc_url,
          documentFilename: item.document.attached? ? item.document.filename.to_s : nil,
          createdAt: item.created_at.iso8601,
          updatedAt: item.updated_at.iso8601
        }
      end

      def serialize_idea_note(item)
        {
          id: item.id.to_s,
          category: item.category,
          title: item.title,
          content: item.content,
          createdAt: item.created_at.iso8601,
          tags: item.tags
        }
      end

      def serialize_member(item)
        {
          id: item.id.to_s,
          firstName: item.first_name,
          lastName: item.last_name,
          email: item.email,
          avatar: item.avatar
        }
      end

      def serialize_calendar_entry(training)
        {
          trainingId: training.id.to_s,
          title: training.title,
          status: training.status,
          sessions: training.sessions.order(:start_date).map do |session|
            {
              sessionId: session.id.to_s,
              startDate: session.start_date.iso8601,
              endDate: session.end_date.iso8601
            }
          end
        }
      end

      def build_stats(trainings)
        {
          byStatus: Academy::Training::STATUSES.index_with { |status| trainings.count { |item| item.status == status } },
          total: trainings.size
        }
      end
    end
  end
end
