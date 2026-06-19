module Api
  module V1
    class AcademyController < BaseController
      skip_before_action :require_authentication, only: [:index]
      before_action :require_effective_member, except: [:index]

      def index
        render json: academy_payload
      end

      def dashboard
        render json: Academy::DashboardService.new.call
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
        item.status = 'idea' if item.status.blank?
        item.checklist_items = training_type.checklist_template if item.checklist_items.blank?
        item.save!

        if params[:participant_categories].present?
          create_categories_from_params(item, params[:participant_categories])
        elsif training_type.default_categories.present?
          training_type.default_categories.each_with_index do |dc, idx|
            item.participant_categories.create!(
              label: dc['label'],
              price: dc['price'] || 0,
              max_spots: dc['maxSpots'] || dc['max_spots'] || 0,
              deposit_amount: dc['depositAmount'] || dc['deposit_amount'] || 0,
              position: idx
            )
          end
        end

        if params[:packs].present?
          create_packs_from_params(item, params[:packs])
        elsif training_type.default_packs.present?
          create_packs_from_type_defaults(item, training_type.default_packs)
        end

        broadcast_training_change(action: "created", training: item.reload)
        render json: serialize_training(item), status: :created
      end

      def update_training
        item = Academy::Training.find(params.require(:training_id))
        item.update!(training_update_params)

        if params[:participant_categories].present?
          update_categories_for_training(item, params[:participant_categories])
        end

        update_packs_for_training(item, params[:packs]) if params[:packs].present?

        broadcast_training_change(action: "updated", training: item.reload)
        render json: serialize_training(item)
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def destroy_training
        item = Academy::Training.find(params.require(:training_id))
        training_id = item.id.to_s
        item.soft_delete!

        broadcast_training_destroy(training_id: training_id)
        head :no_content
      end

      def update_training_status
        item = Academy::Training.find(params.require(:training_id))
        new_status = params.require(:status)

        if new_status == 'registrations_open' && item.participant_categories.where('max_spots > 0').none?
          return render json: { error: "Impossible d'ouvrir les inscriptions sans catégorie de participants active" }, status: :unprocessable_entity
        end

        item.update!(status: new_status)

        broadcast_training_change(action: "updated", training: item)
        render json: serialize_training(item)
      end

      def create_session
        training = Academy::Training.find(params.require(:training_id))
        item = training.sessions.create!(session_params)

        broadcast_session_change(action: "created", session: item)
        render json: serialize_session(item), status: :created
      end

      def update_session
        item = Academy::TrainingSession.find(params.require(:session_id))
        item.update!(session_params)

        broadcast_session_change(action: "updated", session: item)
        render json: serialize_session(item)
      end

      def destroy_session
        item = Academy::TrainingSession.find(params.require(:session_id))
        session_id = item.id.to_s
        training_id = item.training_id.to_s
        item.soft_delete!

        broadcast_session_destroy(session_id: session_id, training_id: training_id)
        head :no_content
      end

      # Renders the reminder email (HTML) for a session with the supplied custom
      # blocks, plus the recipient list — drives the admin composer's live preview.
      def reminder_preview
        session = Academy::TrainingSession.find(params.require(:session_id))
        training = session.training
        sample = training.registrations.first || training.registrations.build(contact_name: "Aperçu", contact_email: "apercu@example.com")

        mail = AcademyMailer.session_reminder(
          session, sample,
          intro_html: params[:intro_html].to_s,
          bonus_html: params[:bonus_html].to_s
        )
        html = mail.html_part&.body&.decoded || mail.body.decoded

        render json: {
          subject: mail.subject,
          html: html,
          recipients: training.registrations.map { |r| { name: r.contact_name, email: r.contact_email } }
        }
      end

      # Sends the session reminder. With test_email, sends a single copy there;
      # otherwise enqueues one personalized email per registration of the training.
      def send_reminder
        session = Academy::TrainingSession.find(params.require(:session_id))
        training = session.training
        intro_html = params[:intro_html].to_s
        bonus_html = params[:bonus_html].to_s

        if params[:test_email].present?
          sample = training.registrations.first&.dup || training.registrations.build
          sample.assign_attributes(contact_email: params[:test_email], contact_name: sample.contact_name.presence || "Test")
          # deliver_now: the synthetic registration isn't persisted, so it can't be
          # GlobalID-serialized for a background job — and a test send should be immediate anyway.
          AcademyMailer.session_reminder(session, sample, intro_html: intro_html, bonus_html: bonus_html).deliver_now
          return render json: { sent: 1, test: true }
        end

        recipients = training.registrations.where.not(contact_email: [nil, ""])
        recipients.each do |registration|
          AcademyMailer.session_reminder(session, registration, intro_html: intro_html, bonus_html: bonus_html).deliver_later
        end

        render json: { sent: recipients.size }
      end

      def create_registration
        training = Academy::Training.find(params.require(:training_id))
        resolved_id = resolve_contact_for_registration(registration_params)

        ActiveRecord::Base.transaction do
          item = training.registrations.create!(
            registration_params.except(:registered_at).merge(
              registered_at: registration_params[:registered_at] || Time.current,
              contact_id: resolved_id
            )
          )

          if params[:items].present?
            setting = Academy::Setting.current
            params[:items].each do |item_params|
              cat = training.participant_categories.find(item_params[:participant_category_id])
              qty = item_params[:quantity].to_i

              if qty > cat.spots_remaining
                raise ActiveRecord::RecordInvalid.new(item), "Plus assez de places pour la catégorie '#{cat.label}'"
              end

              discount = setting.discount_for_quantity(qty)
              item.registration_items.create!(
                participant_category: cat,
                quantity: qty,
                unit_price: cat.price,
                discount_percent: discount
              )
            end
          end

          if params[:packs].present?
            params[:packs].each do |pack_params|
              pack = training.packs.find(pack_params[:pack_id])
              qty = pack_params[:quantity].to_i
              next if qty <= 0

              pack.pack_items.includes(:participant_category).each do |pi|
                needed = pi.quantity * qty
                if needed > pi.participant_category.spots_remaining
                  raise ActiveRecord::RecordInvalid.new(item),
                    "Plus assez de places '#{pi.participant_category.label}' pour le pack '#{pack.name}'"
                end
              end

              item.registration_packs.create!(
                pack: pack,
                quantity: qty,
                unit_price: pack.price
              )
            end
          end

          item.recompute_payment_amount! if params[:items].present? || params[:packs].present?

          render json: serialize_registration(item.reload), status: :created
        end
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def update_registration
        item = Academy::TrainingRegistration.find(params.require(:registration_id))
        attrs = registration_update_params
        if attrs[:contact_email].present?
          attrs = attrs.merge(contact_id: resolve_contact_for_registration(attrs))
        end

        ActiveRecord::Base.transaction do
          item.update!(attrs)

          needs_recompute = false

          if params.key?(:items)
            training = item.training
            setting = Academy::Setting.current

            item.registration_items.destroy_all

            Array(params[:items]).each do |item_params|
              cat = training.participant_categories.find(item_params[:participant_category_id])
              qty = item_params[:quantity].to_i
              next if qty <= 0

              discount = setting.discount_for_quantity(qty)
              item.registration_items.create!(
                participant_category: cat,
                quantity: qty,
                unit_price: cat.price,
                discount_percent: discount
              )
            end

            needs_recompute = true
          end

          if params.key?(:packs)
            training = item.training
            item.registration_packs.destroy_all

            Array(params[:packs]).each do |pack_params|
              pack = training.packs.find(pack_params[:pack_id])
              qty = pack_params[:quantity].to_i
              next if qty <= 0

              pack.pack_items.includes(:participant_category).each do |pi|
                needed = pi.quantity * qty
                if needed > pi.participant_category.spots_remaining
                  raise ActiveRecord::RecordInvalid.new(item),
                    "Plus assez de places '#{pi.participant_category.label}' pour le pack '#{pack.name}'"
                end
              end

              item.registration_packs.create!(
                pack: pack,
                quantity: qty,
                unit_price: pack.price
              )
            end

            needs_recompute = true
          end

          item.recompute_payment_amount! if needs_recompute
        end

        render json: serialize_registration(item.reload)
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
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
        status = params[:status] || (params[:is_present] ? 'present' : 'absent')
        item.assign_attributes(status: status, note: params[:note].to_s)
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

      def list_team
        contacts = Contact.joins(:contact_tags)
          .where(contact_tags: { name: "academy" })
          .where(deleted_at: nil)
          .distinct
          .order(:name)
        render json: contacts.map { |c| serialize_academy_contact(c) }
      end

      def create_team_member
        email = params[:email].to_s.strip.downcase
        existing = Contact.find_by("LOWER(email) = ?", email) if email.present?

        if existing
          unless existing.contact_tags.exists?(name: "academy")
            existing.contact_tags.create!(name: "academy")
          end
          existing.update!(team_member_params.except(:email))
          render json: serialize_academy_contact(existing.reload)
        else
          contact = Contact.create!(team_member_params.merge(contact_type: "person"))
          contact.contact_tags.create!(name: "academy")
          render json: serialize_academy_contact(contact), status: :created
        end
      end

      def update_team_member
        contact = Contact.find(params[:contact_id])
        contact.update!(team_member_params)
        render json: serialize_academy_contact(contact)
      end

      def remove_team_member
        contact = Contact.find(params[:contact_id])
        tag = contact.contact_tags.find_by(name: "academy")
        tag&.destroy!
        head :no_content
      end

      def show_team_member
        contact = Contact.find(params[:contact_id])
        sessions = Academy::TrainingSession.all.select { |s| (s.trainer_ids || []).include?(contact.id.to_s) }
        training_ids = sessions.map(&:training_id).uniq
        trainings = Academy::Training.where(id: training_ids).includes(:training_type)

        upcoming = sessions.select { |s| s.start_date >= Date.current }.min_by(&:start_date)

        render json: {
          contact: serialize_academy_contact(contact),
          trainings: trainings.map { |t|
            t_sessions = sessions.select { |s| s.training_id == t.id }
            {
              id: t.id.to_s,
              title: t.title,
              status: t.status,
              typeName: t.training_type&.name,
              sessionCount: t_sessions.size,
              firstDate: t_sessions.map(&:start_date).min&.iso8601,
              lastDate: t_sessions.map(&:end_date).max&.iso8601
            }
          },
          stats: {
            totalSessions: sessions.size,
            totalTrainings: trainings.size,
            nextSession: upcoming ? { date: upcoming.start_date.iso8601, trainingId: upcoming.training_id.to_s } : nil
          }
        }
      end

      def check_team_email
        email = params[:email].to_s.strip.downcase
        return render(json: { exists: false }) if email.blank?

        contact = Contact.find_by("LOWER(email) = ?", email)
        if contact
          has_tag = contact.contact_tags.exists?(name: "academy")
          render json: {
            exists: true,
            hasAcademyTag: has_tag,
            contact: { id: contact.id.to_s, name: contact.name, email: contact.email }
          }
        else
          render json: { exists: false }
        end
      end

      def academy_settings
        render json: serialize_academy_settings(Academy::Setting.current)
      end

      def update_academy_settings
        setting = Academy::Setting.current
        setting.update!(
          volume_discount_per_spot: params[:volume_discount_per_spot],
          volume_discount_max: params[:volume_discount_max]
        )
        render json: serialize_academy_settings(setting)
      end

      def toggle_holiday
        date = Date.parse(params.require(:date))
        existing = Academy::Holiday.find_by(date: date)

        if existing
          existing.destroy!
          head :no_content
        else
          Academy::Holiday.create!(date: date)
          render json: { date: date.iso8601 }, status: :created
        end
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
        expenses = trainings.sum do |training|
          training.attributed_expenses.sum { |expense| expense.attributed_amount_excl_vat_for(training).to_f }
        end
        total_participants = trainings.sum { |item| item.registrations.size }

        by_status = Academy::Training::STATUSES.index_with do |status|
          trainings.count { |t| t.status == status }
        end

        expenses_by_category = Hash.new(0.to_d)
        trainings.each do |training|
          training.attributed_expenses.each do |expense|
            next if expense.category.nil?

            expenses_by_category[expense.category] += expense.attributed_amount_excl_vat_for(training)
          end
        end
        expenses_by_category.transform_values!(&:to_f)

        fill_rates = trainings.filter_map do |t|
          cap = t.total_capacity
          next if cap.zero?
          (t.registrations.size.to_f / cap * 100).round(1)
        end
        average_fill_rate = fill_rates.any? ? (fill_rates.sum / fill_rates.size).round(1) : 0

        fill_rates_by_type = trainings.group_by { |t| t.training_type&.name || "Sans type" }.filter_map do |type_name, type_trainings|
          rates = type_trainings.filter_map do |t|
            cap = t.total_capacity
            next if cap.zero?
            (t.registrations.size.to_f / cap * 100).round(1)
          end
          next if rates.empty?
          { name: type_name, fillRate: (rates.sum / rates.size).round(1), trainingsCount: type_trainings.size }
        end.sort_by { |entry| -entry[:fillRate] }

        sessions_for_reporting = Academy::TrainingSession.all
        academy_contacts = Contact.joins(:contact_tags)
          .where(contact_tags: { name: "academy" })
          .where(deleted_at: nil)
          .distinct

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
          fillRatesByType: fill_rates_by_type,
          sessionsByTrainer: build_sessions_by_trainer(sessions_for_reporting, academy_contacts)
        }
      end

      def calendar_links
        base_url = request.base_url
        semisto_token = CalendarFeedToken.issue(feed: "semisto")
        trainings_token = CalendarFeedToken.issue(feed: "trainings")

        render json: {
          semisto: {
            url: "#{base_url}/calendar/semisto.ics?token=#{CGI.escape(semisto_token)}",
            plainUrl: "#{base_url}/calendar/semisto.ics"
          },
          trainings: {
            url: "#{base_url}/calendar/trainings.ics?token=#{CGI.escape(trainings_token)}",
            plainUrl: "#{base_url}/calendar/trainings.ics"
          },
          instructions: [
            "Dans Google Agenda, cliquez sur + à côté de ‘Autres agendas’.",
            "Choisissez ‘À partir de l’URL’, collez le lien puis validez."
          ]
        }
      end

      private

      def academy_payload
        training_types = Academy::TrainingType.order(:name)
        trainings = Academy::Training.includes(:album, :participant_categories).order(updated_at: :desc)
        sessions = Academy::TrainingSession.includes(feedbacks: :contact).order(start_date: :asc)
        locations = Academy::TrainingLocation.order(:name)
        registrations = Academy::TrainingRegistration
          .includes(
            registration_items: :participant_category,
            registration_packs: { pack: { pack_items: :participant_category } },
            training: %i[participant_categories packs]
          )
          .order(registered_at: :desc)
        attendances = Academy::TrainingAttendance.where(registration_id: Academy::TrainingRegistration.select(:id)).order(updated_at: :desc)
        documents = Academy::TrainingDocument.order(uploaded_at: :desc)
        training_expenses = trainings.flat_map do |training|
          training.attributed_expenses.map { |expense| [expense, training] }
        end.sort_by { |expense, _training| expense.invoice_date || Date.new(0) }.reverse
        idea_notes = Academy::IdeaNote.order(created_at: :desc)
        members = Member.order(:first_name, :last_name)
        team = Contact.joins(:contact_tags)
          .where(contact_tags: { name: "academy" })
          .where(deleted_at: nil)
          .distinct
          .order(:name)
        holidays = Academy::Holiday.order(:date).pluck(:date).map(&:iso8601)
        serialized_sessions = sessions.map { |item| serialize_session(item) }

        {
          trainingTypes: training_types.map { |item| serialize_training_type(item) },
          trainings: trainings.map { |item| serialize_training(item) },
          trainingSessions: serialized_sessions,
          holidays: holidays,
          calendarEvents: serialized_sessions.map { |session| session.slice(:id, :startDate, :endDate).merge(type: 'training_session', readOnly: false, trainingId: session[:trainingId]) },
          trainingLocations: locations.map { |item| serialize_location(item) },
          trainingRegistrations: registrations.map { |item| serialize_registration(item) },
          trainingAttendances: attendances.map { |item| serialize_attendance(item) },
          trainingDocuments: documents.map { |item| serialize_document(item) },
          trainingExpenses: training_expenses.map { |item, training| serialize_expense(item, projectable: training) },
          ideaNotes: idea_notes.map { |item| serialize_idea_note(item) },
          members: members.map { |item| serialize_member(item) },
          academyContacts: team.map { |item| serialize_academy_contact(item) },
          academySettings: serialize_academy_settings(Academy::Setting.current),
          stats: build_stats(trainings)
        }
      end

      def broadcast_training_change(action:, training:)
        ActionCable.server.broadcast("academy_trainings", {
          type: "training",
          action: action,
          training: serialize_training(training)
        })
      end

      def broadcast_training_destroy(training_id:)
        ActionCable.server.broadcast("academy_trainings", {
          type: "training",
          action: "destroyed",
          trainingId: training_id
        })
      end

      def broadcast_session_change(action:, session:)
        ActionCable.server.broadcast("academy_trainings", {
          type: "session",
          action: action,
          session: serialize_session(session)
        })
      end

      def broadcast_session_destroy(session_id:, training_id:)
        ActionCable.server.broadcast("academy_trainings", {
          type: "session",
          action: "destroyed",
          sessionId: session_id,
          trainingId: training_id
        })
      end

      def training_type_params
        params.permit(:name, :description, :color, checklist_template: [], photo_gallery: [], trainer_ids: [],
                      default_categories: [:label, :price, :maxSpots, :max_spots, :depositAmount, :deposit_amount],
                      task_templates: [:name, :scope, :anchor, :offset_days],
                      default_packs: [:name, :price, :deposit_amount, { items: [:category_label, :quantity] }])
      end

      def location_params
        params.permit(:name, :address, :description, :capacity, :has_accommodation, :latitude, :longitude, photo_gallery: [], compatible_training_type_ids: [])
      end

      def training_params
        params.permit(:title, :status, :price, :deposit_amount, :vat_rate, :max_participants, :requires_accommodation, :share_participant_directory, :description, :coordinator_note, checklist_items: [], checked_items: [], access_contact_ids: [])
      end

      def training_update_params
        params.permit(:title, :status, :price, :deposit_amount, :vat_rate, :max_participants, :requires_accommodation, :share_participant_directory, :description, :coordinator_note, :training_type_id, checklist_items: [], checked_items: [], access_contact_ids: [])
      end

      def session_params
        params.permit(:start_date, :end_date, :description, :topic, :meeting_point, :meeting_time, :meals_info, :accommodation_info, location_ids: [], trainer_ids: [], assistant_ids: [], packing_list: [])
      end

      def registration_params
        params.permit(:contact_id, :contact_name, :contact_email, :phone, :departure_city, :departure_postal_code, :departure_country, :carpooling, :amount_paid, :payment_status, :internal_note, :registered_at, :photo_consent)
      end

      def registration_update_params
        params.permit(:contact_id, :contact_name, :contact_email, :phone, :departure_city, :departure_postal_code, :departure_country, :carpooling, :amount_paid, :payment_status, :internal_note, :photo_consent)
      end

      def resolve_contact_for_registration(reg_params)
        Academy::RegistrationContactResolver.call(
          contact_id: reg_params[:contact_id],
          name: reg_params[:contact_name],
          email: reg_params[:contact_email],
          phone: reg_params[:phone],
          newsletter: params[:newsletter_subscribed]
        )
      end

      def document_params
        params.permit(:name, :url, :uploaded_by, :file, :session_id)
      end

      def expense_params
        params.permit(
          :supplier, :supplier_contact_id, :status, :invoice_date, :category, :expense_type, :billing_zone,
          :payment_date, :payment_type, :amount_excl_vat, :vat_rate,
          :vat_6, :vat_12, :vat_21, :total_incl_vat, :eu_vat_rate, :eu_vat_amount,
          :paid_by, :reimbursed, :reimbursement_date, :billable_to_client, :rebilling_status,
          :name, :notes, :projectable_type, :projectable_id,
          poles: []
        )
      end

      def team_member_params
        params.permit(:name, :email, :phone, :address, :notes, :notes_html, expertise: [])
      end

      def idea_note_params
        params.permit(:category, :title, :content, tags: [])
      end

      def serialize_training_type(item)
        {
          id: item.id.to_s,
          name: item.name,
          description: item.description,
          color: item.color,
          checklistTemplate: item.checklist_template,
          defaultCategories: item.default_categories,
          defaultPacks: item.default_packs,
          taskTemplates: item.task_templates,
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

      # Préparation à la clôture (#48). Critère bien défini et calculable :
      # l'encaissement des paiements participants (payment_status). Les autres
      # critères évoqués (documents envoyés, dépenses fournisseurs reçues) ne
      # sont pas encore modélisés (pas de flag « envoyé » / pas de dépense
      # « attendue ») → suivis séparés.
      def closure_readiness(item)
        total = item.registrations.count
        paid = item.registrations.where(payment_status: "paid").count
        unpaid = total - paid
        {
          totalRegistrations: total,
          paidCount: paid,
          unpaidCount: unpaid,
          allPaid: unpaid.zero?
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
          shareParticipantDirectory: item.share_participant_directory,
          description: item.description,
          coordinatorNote: item.coordinator_note,
          checklistItems: item.checklist_items,
          checkedItems: item.checked_items,
          accessContactIds: item.access_contact_ids,
          accessContacts: access_contacts_for(item.access_contact_ids),
          album: item.album ? serialize_training_album(item.album) : nil,
          participantCategories: item.participant_categories.order(:position).map { |c|
            { id: c.id.to_s, label: c.label, price: c.price.to_f, maxSpots: c.max_spots,
              depositAmount: c.deposit_amount.to_f, spotsTaken: c.spots_taken,
              spotsRemaining: c.spots_remaining, position: c.position }
          },
          packs: item.packs.includes(pack_items: :participant_category).order(:position).map { |p| serialize_pack(p) },
          totalCapacity: item.total_capacity,
          totalSpotsTaken: item.total_spots_taken,
          closureReadiness: closure_readiness(item),
          createdAt: item.created_at.iso8601,
          updatedAt: item.updated_at.iso8601
        }
      end

      # Resolves contact IDs (granted My Semisto access) to lightweight {id,name,email}.
      # Memoizes contacts across the request to avoid an N+1 in the overview action
      # (which serializes every training).
      def access_contacts_for(ids)
        return [] if ids.blank?
        @contacts_by_id ||= {}
        missing = ids.map(&:to_s) - @contacts_by_id.keys
        Contact.where(id: missing).each { |c| @contacts_by_id[c.id.to_s] = c } if missing.any?
        ids.filter_map { |id| @contacts_by_id[id.to_s] }
           .map { |c| { id: c.id.to_s, name: c.display_name, email: c.email.to_s } }
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
          topic: item.topic,
          meetingPoint: item.meeting_point,
          meetingTime: item.meeting_time,
          mealsInfo: item.meals_info,
          accommodationInfo: item.accommodation_info,
          packingList: item.packing_list,
          feedback: serialize_session_feedback(item)
        }
      end

      # Synthèse des avis « à chaud » des participant·es sur une session, pour la
      # consultation côté admin : nombre, note moyenne, nombre de recommandations,
      # et le détail nominatif de chaque réponse.
      def serialize_session_feedback(item)
        entries = item.feedbacks.to_a
        count = entries.size
        {
          count: count,
          averageRating: count.positive? ? (entries.sum(&:rating).to_f / count).round(2) : nil,
          recommendCount: entries.count(&:would_recommend),
          responses: entries.sort_by(&:created_at).map { |f|
            {
              id: f.id.to_s,
              rating: f.rating,
              wouldRecommend: f.would_recommend,
              comment: f.comment.to_s,
              contactName: f.contact&.display_name,
              createdAt: f.created_at.iso8601
            }
          }
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
          paymentAmount: item.computed_expected_amount,
          paymentStatus: item.payment_status,
          stripePaymentIntentId: item.stripe_payment_intent_id,
          internalNote: item.internal_note,
          photoConsent: item.photo_consent,
          registeredAt: item.registered_at.iso8601,
          items: item.registration_items.includes(:participant_category).map { |ri|
            { id: ri.id.to_s, participantCategoryId: ri.participant_category_id.to_s,
              categoryLabel: ri.participant_category.label, quantity: ri.quantity,
              unitPrice: ri.unit_price.to_f, discountPercent: ri.discount_percent.to_f,
              subtotal: ri.subtotal.to_f }
          },
          packs: item.registration_packs.includes(pack: { pack_items: :participant_category }).map { |rp|
            {
              id: rp.id.to_s,
              packId: rp.pack_id.to_s,
              packName: rp.pack.name,
              quantity: rp.quantity,
              unitPrice: rp.unit_price.to_f,
              subtotal: rp.subtotal.to_f,
              items: rp.pack.pack_items.map { |pi|
                { categoryLabel: pi.participant_category.label, quantity: pi.quantity }
              }
            }
          }
        }
      end

      def serialize_pack(pack)
        {
          id: pack.id.to_s,
          trainingId: pack.training_id.to_s,
          name: pack.name,
          price: pack.price.to_f,
          depositAmount: pack.deposit_amount.to_f,
          position: pack.position,
          items: pack.pack_items.includes(:participant_category).map { |pi|
            {
              participantCategoryId: pi.participant_category_id.to_s,
              categoryLabel: pi.participant_category.label,
              quantity: pi.quantity
            }
          }
        }
      end

      def serialize_attendance(item)
        {
          id: item.id.to_s,
          registrationId: item.registration_id.to_s,
          sessionId: item.session_id.to_s,
          status: item.status,
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
          uploadedBy: item.uploaded_by,
          sessionId: item.session_id&.to_s
        }
      end

      def serialize_expense(item, projectable: nil)
        doc_url = item.document.attached? ? Rails.application.routes.url_helpers.rails_blob_url(item.document, only_path: true) : nil
        amount_excl_vat = projectable ? item.attributed_amount_excl_vat_for(projectable) : item.amount_excl_vat.to_d
        total_incl_vat = projectable ? item.attributed_amount_incl_vat_for(projectable) : item.total_incl_vat.to_d
        payload = {
          id: projectable && item.multi_project? ? "#{item.id}-#{projectable.id}" : item.id.to_s,
          projectableType: projectable ? projectable.class.name : item.projectable_type,
          projectableId: projectable ? projectable.id.to_s : item.projectable_id&.to_s,
          supplier: item.supplier_display_name,
          supplierContactId: item.supplier_contact_id&.to_s,
          status: item.status,
          invoiceDate: item.invoice_date&.iso8601,
          category: item.category,
          expenseType: item.expense_type,
          billingZone: item.billing_zone,
          paymentDate: item.payment_date&.iso8601,
          paymentType: item.payment_type,
          amountExclVat: amount_excl_vat.to_f,
          vatRate: item.vat_rate,
          vat6: item.vat_6.to_f,
          vat12: item.vat_12.to_f,
          vat21: item.vat_21.to_f,
          totalInclVat: total_incl_vat.to_f,
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
        if projectable
          payload.merge!(
            attributedAmountInclVat: total_incl_vat.to_f,
            attributedAmountExclVat: amount_excl_vat.to_f,
            isAllocation: item.multi_project?,
            fullTotalInclVat: item.total_incl_vat.to_f
          )
        end
        payload
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
          avatar: item.avatar_url
        }
      end

      def serialize_academy_contact(contact)
        {
          id: contact.id.to_s,
          name: contact.name,
          email: contact.email.to_s,
          phone: contact.phone.to_s,
          notes: contact.notes.to_s,
          notesHtml: contact.notes_html.to_s,
          expertise: contact.expertise || [],
          tagNames: contact.tag_names,
          createdAt: contact.created_at.iso8601
        }
      end

      def serialize_calendar_entry(training)
        {
          trainingId: training.id.to_s,
          title: training.title,
          status: training.status,
          sessions: training.sessions.sort_by(&:start_date).map do |session|
            {
              sessionId: session.id.to_s,
              startDate: session.start_date.iso8601,
              endDate: session.end_date.iso8601
            }
          end
        }
      end

      def build_sessions_by_trainer(sessions, academy_contacts)
        counts = Hash.new(0)
        sessions.each do |s|
          (s.trainer_ids || []).each { |tid| counts[tid] += 1 }
        end

        contacts_by_id = academy_contacts.index_by { |c| c.id.to_s }
        counts.filter_map do |contact_id, count|
          contact = contacts_by_id[contact_id.to_s]
          next unless contact
          { name: contact.name, sessionCount: count }
        end.sort_by { |entry| -entry[:sessionCount] }
      end

      def serialize_academy_settings(setting)
        {
          volumeDiscountPerSpot: setting.volume_discount_per_spot.to_f,
          volumeDiscountMax: setting.volume_discount_max.to_f
        }
      end

      def create_categories_from_params(training, categories_params)
        categories_params.each_with_index do |cp, idx|
          training.participant_categories.create!(
            label: cp[:label],
            price: cp[:price] || 0,
            max_spots: cp[:max_spots] || cp[:maxSpots] || 0,
            deposit_amount: cp[:deposit_amount] || cp[:depositAmount] || 0,
            position: idx
          )
        end
      end

      def update_categories_for_training(training, categories_params)
        categories_params.each_with_index do |cp, idx|
          if cp[:id].present?
            cat = training.participant_categories.with_deleted.find(cp[:id])
            if cp[:_destroy].present? && cp[:_destroy].to_s != 'false'
              if cat.registration_items.any?
                raise ActiveRecord::RecordInvalid.new(cat), "La catégorie '#{cat.label}' a des inscriptions et ne peut pas être supprimée"
              end
              cat.soft_delete!
            else
              cat.restore! if cat.deleted?
              cat.update!(
                label: cp[:label] || cat.label,
                price: cp[:price] || cat.price,
                max_spots: cp[:max_spots] || cp[:maxSpots] || cat.max_spots,
                deposit_amount: cp[:deposit_amount] || cp[:depositAmount] || cat.deposit_amount,
                position: idx
              )
            end
          else
            training.participant_categories.create!(
              label: cp[:label],
              price: cp[:price] || 0,
              max_spots: cp[:max_spots] || cp[:maxSpots] || 0,
              deposit_amount: cp[:deposit_amount] || cp[:depositAmount] || 0,
              position: idx
            )
          end
        end
      end

      def create_packs_from_params(training, packs_params)
        packs_params.each_with_index do |pp, idx|
          pack = training.packs.create!(
            name: pp[:name],
            price: pp[:price] || 0,
            deposit_amount: pp[:deposit_amount] || 0,
            position: idx
          )
          Array(pp[:items]).each do |ip|
            pack.pack_items.create!(
              participant_category_id: ip[:participant_category_id],
              quantity: ip[:quantity].to_i
            )
          end
        end
      end

      # Crée les packs par défaut du type sur une nouvelle activité. Les items
      # référencent les catégories par libellé → on mappe vers les catégories
      # qu'on vient de créer sur l'activité (un item dont le libellé ne matche
      # aucune catégorie est ignoré).
      def create_packs_from_type_defaults(training, default_packs)
        label_to_id = training.participant_categories.each_with_object({}) do |cat, map|
          map[cat.label] = cat.id
        end

        default_packs.each_with_index do |pp, idx|
          pack = training.packs.create!(
            name: pp["name"],
            price: pp["price"] || 0,
            deposit_amount: pp["deposit_amount"] || 0,
            position: idx
          )
          Array(pp["items"]).each do |ip|
            category_id = label_to_id[ip["category_label"]]
            next unless category_id

            pack.pack_items.create!(participant_category_id: category_id, quantity: ip["quantity"].to_i)
          end
        end
      end

      def update_packs_for_training(training, packs_params)
        packs_params.each_with_index do |pp, idx|
          if pp[:id].present?
            pack = training.packs.with_deleted.find(pp[:id])
            if pp[:_destroy].present? && pp[:_destroy].to_s != 'false'
              if pack.registration_packs.any?
                raise ActiveRecord::RecordInvalid.new(pack), "Le pack '#{pack.name}' est utilisé dans des inscriptions et ne peut pas être supprimé"
              end
              pack.soft_delete!
            else
              pack.restore! if pack.deleted?
              pack.update!(
                name: pp[:name] || pack.name,
                price: pp[:price] || pack.price,
                deposit_amount: pp[:deposit_amount] || pack.deposit_amount,
                position: idx
              )
              pack.pack_items.destroy_all
              Array(pp[:items]).each do |ip|
                pack.pack_items.create!(
                  participant_category_id: ip[:participant_category_id],
                  quantity: ip[:quantity].to_i
                )
              end
            end
          else
            pack = training.packs.create!(
              name: pp[:name],
              price: pp[:price] || 0,
              deposit_amount: pp[:deposit_amount] || 0,
              position: idx
            )
            Array(pp[:items]).each do |ip|
              pack.pack_items.create!(
                participant_category_id: ip[:participant_category_id],
                quantity: ip[:quantity].to_i
              )
            end
          end
        end
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
