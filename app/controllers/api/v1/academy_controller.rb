module Api
  module V1
    class AcademyController < ApplicationController
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
        Academy::TrainingType.find(params.require(:training_type_id)).destroy!
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
        Academy::TrainingLocation.find(params.require(:location_id)).destroy!
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
        Academy::Training.find(params.require(:training_id)).destroy!
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
        Academy::TrainingSession.find(params.require(:session_id)).destroy!
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
        Academy::TrainingRegistration.find(params.require(:registration_id)).destroy!
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
        item = training.documents.create!(document_params.merge(uploaded_at: Time.current))
        render json: serialize_document(item), status: :created
      end

      def destroy_document
        Academy::TrainingDocument.find(params.require(:document_id)).destroy!
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
        render json: serialize_expense(item), status: :created
      end

      def update_expense
        item = Academy::TrainingExpense.find(params.require(:expense_id))
        item.update!(expense_params)
        render json: serialize_expense(item)
      end

      def destroy_expense
        Academy::TrainingExpense.find(params.require(:expense_id)).destroy!
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
        Academy::IdeaNote.find(params.require(:note_id)).destroy!
        head :no_content
      end

      def calendar
        trainings = Academy::Training.includes(:sessions).order(updated_at: :desc)
        render json: trainings.map { |item| serialize_calendar_entry(item) }
      end

      def reporting
        trainings = Academy::Training.includes(:registrations, :expenses)
        revenue = trainings.sum { |item| item.registrations.sum(&:amount_paid).to_f }
        expenses = trainings.sum { |item| item.expenses.sum(&:amount).to_f }

        render json: {
          trainingsCount: trainings.size,
          completedTrainings: trainings.count { |item| item.status == 'completed' },
          totalRevenue: revenue,
          totalExpenses: expenses,
          profitability: revenue - expenses
        }
      end

      private

      def academy_payload
        training_types = Academy::TrainingType.order(:name)
        trainings = Academy::Training.order(updated_at: :desc)
        sessions = Academy::TrainingSession.order(start_date: :asc)
        locations = Academy::TrainingLocation.order(:name)
        registrations = Academy::TrainingRegistration.order(registered_at: :desc)
        attendances = Academy::TrainingAttendance.order(updated_at: :desc)
        documents = Academy::TrainingDocument.order(uploaded_at: :desc)
        expenses = Academy::TrainingExpense.order(date: :desc)
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
        params.permit(:name, :address, :description, :capacity, :has_accommodation, photo_gallery: [], compatible_training_type_ids: [])
      end

      def training_params
        params.permit(:title, :status, :price, :max_participants, :requires_accommodation, :description, :coordinator_note, checklist_items: [], checked_items: [])
      end

      def training_update_params
        params.permit(:title, :status, :price, :max_participants, :requires_accommodation, :description, :coordinator_note, checklist_items: [], checked_items: [])
      end

      def session_params
        params.permit(:start_date, :end_date, :description, location_ids: [], trainer_ids: [], assistant_ids: [])
      end

      def registration_params
        params.permit(:contact_id, :contact_name, :contact_email, :amount_paid, :payment_status, :internal_note)
      end

      def registration_update_params
        params.permit(:contact_name, :contact_email, :amount_paid, :payment_status, :internal_note)
      end

      def document_params
        params.permit(:name, :document_type, :url, :uploaded_by)
      end

      def expense_params
        params.permit(:category, :description, :amount, :date)
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
          maxParticipants: item.max_participants,
          requiresAccommodation: item.requires_accommodation,
          description: item.description,
          coordinatorNote: item.coordinator_note,
          checklistItems: item.checklist_items,
          checkedItems: item.checked_items,
          createdAt: item.created_at.iso8601,
          updatedAt: item.updated_at.iso8601
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
          description: item.description
        }
      end

      def serialize_registration(item)
        {
          id: item.id.to_s,
          trainingId: item.training_id.to_s,
          contactId: item.contact_id,
          contactName: item.contact_name,
          contactEmail: item.contact_email,
          amountPaid: item.amount_paid.to_f,
          paymentStatus: item.payment_status,
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
        {
          id: item.id.to_s,
          trainingId: item.training_id.to_s,
          name: item.name,
          type: item.document_type,
          url: item.url,
          uploadedAt: item.uploaded_at.iso8601,
          uploadedBy: item.uploaded_by
        }
      end

      def serialize_expense(item)
        {
          id: item.id.to_s,
          trainingId: item.training_id.to_s,
          category: item.category,
          description: item.description,
          amount: item.amount.to_f,
          date: item.date.iso8601,
          createdAt: item.created_at.iso8601
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
