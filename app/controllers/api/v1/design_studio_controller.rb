module Api
  module V1
    class DesignStudioController < BaseController
      CLIENT_PORTAL_ACTIONS = %i[
        client_portal client_approve_quote client_reject_quote
        client_submit_questionnaire client_add_wishlist_item client_add_journal_entry
      ].freeze

      PROJECT_TYPE_LABELS = {
        'prive' => 'Privé',
        'professionnel' => 'Professionnel',
        'collectif' => 'Collectif',
        'public' => 'Public'
      }.freeze

      CLIENT_INTEREST_LABELS = {
        'design' => 'Design',
        'plant_selection' => 'Sélection des plantes',
        'personalized_coaching' => 'Coaching personnalisé',
        'implementation_support' => 'Accompagnement à la mise en œuvre',
        'five_year_follow_up' => 'Suivi sur 5 ans'
      }.freeze

      ACQUISITION_CHANNEL_LABELS = {
        'bouche_a_oreille' => 'Bouche-à-oreille',
        'presse' => 'Presse',
        'autre' => 'Autre'
      }.freeze

      MONTH_ABBR_TO_NUM = { 'jan' => 1, 'feb' => 2, 'mar' => 3, 'apr' => 4, 'may' => 5, 'jun' => 6,
                            'jul' => 7, 'aug' => 8, 'sep' => 9, 'oct' => 10, 'nov' => 11, 'dec' => 12 }.freeze

      ZONING_CATEGORY_LABELS = {
        'zone_agricole' => 'Zone agricole',
        'zone_habitat' => "Zone d'habitat",
        'zone_forestiere' => 'Zone forestière',
        'zone_naturelle' => 'Zone naturelle',
        'zone_mixte' => 'Zone mixte',
        'autre' => 'Autre'
      }.freeze

      skip_before_action :require_authentication, only: CLIENT_PORTAL_ACTIONS
      before_action :require_effective_member, except: CLIENT_PORTAL_ACTIONS
      before_action :require_client_portal_access, only: CLIENT_PORTAL_ACTIONS
      def index
        projects = Design::Project.includes(:team_members).order(updated_at: :desc)
        templates = Design::ProjectTemplate.order(:name)
        task_counts = Design::Task.joins(:task_list).where(design_task_lists: { project_id: projects.select(:id) }).group("design_task_lists.project_id").count

        render json: {
          projects: projects.map { |project| serialize_project(project, task_count: task_counts[project.id] || 0).merge(teamMembers: project.team_members.order(:assigned_at).map { |item| serialize_team_member(item) }) },
          stats: build_stats(projects),
          templates: templates.map { |template| serialize_template(template) }
        }
      end

      def reporting
        render json: DesignReportingService.new(reporting_filters).call
      end

      def show
        project = find_project
        palette = ensure_palette(project)

        render json: full_project_payload(project, palette)
      end

      def create
        template = params[:template_id].present? ? Design::ProjectTemplate.find(params[:template_id]) : nil
        project = Design::Project.new(project_params)

        apply_template_defaults(project, template) if template
        project.phase = 'offre' if project.phase.blank?
        project.project_manager_id = Member.order(:id).pick(:id)&.to_s || 'unassigned' if project.project_manager_id.blank?
        project.status = 'pending' if project.status.blank?
        project.client_id = "client-#{SecureRandom.hex(4)}" if project.client_id.blank?

        project.save!
        ensure_palette(project)
        ensure_planting_plan(project)
        ensure_client_contribution(project)
        ensure_harvest_calendar(project)
        ensure_maintenance_calendar(project)

        render json: serialize_project(project), status: :created
      end

      def update
        project = find_project
        project.update!(project_update_params)
        render json: serialize_project(project)
      end

      def destroy
        project = find_project
        task_count = Design::Task.joins(:task_list).where(design_task_lists: { project_id: project.id }).count

        if task_count > 0
          render json: { error: "Impossible de supprimer ce projet : il reste #{task_count} tâche#{'s' if task_count > 1}. Supprimez d'abord toutes les tâches." }, status: :unprocessable_entity
          return
        end

        project.soft_delete!
        head :no_content
      end

      def duplicate
        source = find_project

        copy = source.dup
        copy.name = "#{source.name} (copie)"
        copy.status = 'pending'
        copy.phase = 'offre'
        copy.start_date = nil
        copy.planting_date = nil
        copy.save!

        source.team_members.find_each do |item|
          copy.team_members.create!(
            member_id: item.member_id,
            member_name: item.member_name,
            member_email: item.member_email,
            member_avatar: item.member_avatar,
            role: item.role,
            is_paid: item.is_paid,
            assigned_at: Time.current
          )
        end

        source_palette = source.palette
        if source_palette
          palette_copy = ensure_palette(copy)
          source_palette.items.find_each do |item|
            palette_copy.items.create!(
              species_id: item.species_id,
              species_name: item.species_name,
              common_name: item.common_name,
              variety_id: item.variety_id,
              variety_name: item.variety_name,
              layer: item.layer,
              quantity: item.quantity,
              unit_price: item.unit_price,
              notes: item.notes,
              harvest_months: item.harvest_months,
              harvest_products: item.harvest_products
            )
          end
        end

        render json: serialize_project(copy), status: :created
      end

      def create_team_member
        project = find_project
        attrs = team_member_params
        if attrs[:member_id].present? && attrs[:member_id].to_s.match?(/\A\d+\z/)
          member = Member.find_by(id: attrs[:member_id])
          if member
            attrs[:member_name] = "#{member.first_name} #{member.last_name}".strip.presence || member.email
            attrs[:member_email] = member.email.to_s
            attrs[:member_avatar] = member.avatar_url.to_s
          end
        end
        item = project.team_members.create!(attrs)
        render json: serialize_team_member(item), status: :created
      end

      def destroy_team_member
        project = find_project
        project.team_members.find(params.require(:member_id)).soft_delete!
        head :no_content
      end

      def create_timesheet
        project = find_project
        item = project.timesheets.create!(timesheet_params)

        project.increment!(:hours_worked, item.hours.to_f)
        project.increment!(:hours_billed, item.mode == 'billed' ? item.hours.to_f : 0)
        project.increment!(:hours_semos, item.mode == 'semos' ? item.hours.to_f : 0)

        render json: serialize_timesheet(item), status: :created
      end

      def update_timesheet
        item = Design::ProjectTimesheet.find(params.require(:timesheet_id))
        item.update!(timesheet_update_params)
        render json: serialize_timesheet(item)
      end

      def destroy_timesheet
        Design::ProjectTimesheet.find(params.require(:timesheet_id)).soft_delete!
        head :no_content
      end

      def create_expense
        project = find_project
        item = project.expenses.create!(expense_params)
        item.document.attach(params[:document]) if params[:document].present?
        project.update!(expenses_actual: project.expenses.sum(:total_incl_vat))
        render json: serialize_expense(item.reload), status: :created
      end

      def update_expense
        item = Expense.find(params.require(:expense_id))
        item.update!(expense_params)
        item.document.attach(params[:document]) if params[:document].present?
        project = item.design_project
        project&.update!(expenses_actual: project.expenses.sum(:total_incl_vat))
        render json: serialize_expense(item.reload)
      end

      def destroy_expense
        item = Expense.find(params.require(:expense_id))
        project = item.design_project
        item.soft_delete!
        project&.update!(expenses_actual: project.expenses.sum(:total_incl_vat))
        head :no_content
      end

      def approve_expense
        item = Expense.find(params.require(:expense_id))
        item.update!(status: "ready_for_payment")
        render json: serialize_expense(item)
      end

      def upsert_site_analysis
        project = find_project
        item = project.site_analysis || project.build_site_analysis
        item.assign_attributes(normalized_site_analysis_params)
        item.save!

        render json: serialize_site_analysis(item)
      end

      def create_palette_item
        project = find_project
        palette = ensure_palette(project)
        item = palette.items.create!(palette_item_params)

        render json: serialize_palette_item(item), status: :created
      end

      def update_palette_item
        item = Design::ProjectPaletteItem.find(params.require(:item_id))
        item.update!(palette_item_update_params)
        render json: serialize_palette_item(item)
      end

      def destroy_palette_item
        Design::ProjectPaletteItem.find(params.require(:item_id)).soft_delete!
        head :no_content
      end

      def import_palette_from_plants
        project = find_project
        source_palette = Plant::Palette.includes(:items).find(params.require(:plant_palette_id))
        palette = ensure_palette(project)

        source_palette.items.find_each do |plant_item|
          layer = map_strate_to_layer(plant_item.strate_key)
          latin_name = target_latin_name(plant_item.item_type, plant_item.item_id)
          existing = palette.items.find_by(species_id: plant_item.item_id.to_s, variety_id: plant_item.item_type == 'variety' ? plant_item.item_id.to_s : nil)
          next if existing

          palette.items.create!(
            species_id: plant_item.item_id.to_s,
            species_name: latin_name,
            common_name: '',
            variety_id: plant_item.item_type == 'variety' ? plant_item.item_id.to_s : nil,
            variety_name: plant_item.item_type == 'variety' ? latin_name : nil,
            layer: layer,
            quantity: 1,
            unit_price: 0,
            notes: 'Importé depuis Plant Database',
            harvest_months: [],
            harvest_products: []
          )
        end

        render json: serialize_project_palette(palette)
      end

      def export_palette_to_plants
        project = find_project
        palette = ensure_palette(project)

        plant_palette = Plant::Palette.create!(
          name: "Export – #{project.name}",
          description: "Exporté depuis le projet Design Studio « #{project.name} »",
          created_by: current_member.id.to_s
        )

        palette.items.find_each do |item|
          next if item.species_id.blank?

          strate_key = map_layer_to_strate(item.layer)

          if item.variety_id.present?
            item_type = 'variety'
            item_id = item.variety_id
          else
            item_type = 'species'
            item_id = item.species_id
          end

          plant_palette.items.create!(
            item_type: item_type,
            item_id: item_id,
            strate_key: strate_key,
            position: 0
          )
        end

        render json: { paletteId: plant_palette.id.to_s, itemCount: plant_palette.items.count }
      end

      def upsert_planting_plan
        project = find_project
        plan = ensure_planting_plan(project)
        update_attrs = planting_plan_params
        update_attrs[:scale_data] = params[:scale_data].as_json if params[:scale_data].present?
        plan.update!(update_attrs)

        render json: serialize_planting_plan(plan)
      end

      def upload_plan_image
        project = find_project
        plan = ensure_planting_plan(project)
        plan.background_image.attach(params.require(:image))
        render json: serialize_planting_plan(plan.reload)
      end

      def export_planting_plan
        project = find_project
        plan = ensure_planting_plan(project)
        format = params[:format].to_s == 'image' ? 'image' : 'pdf'

        render json: {
          projectId: project.id.to_s,
          format: format,
          exportUrl: plan.image_url.presence || "https://example.com/exports/design/#{project.id}/planting-plan.#{format}",
          generatedAt: Time.current.iso8601
        }
      end

      def create_plant_marker
        project = find_project
        plan = ensure_planting_plan(project)
        number = plan.markers.maximum(:number).to_i + 1

        marker = plan.markers.create!(plant_marker_params.merge(number: number))
        render json: serialize_plant_marker(marker), status: :created
      end

      def update_plant_marker
        marker = Design::PlantMarker.find(params.require(:marker_id))
        marker.update!(plant_marker_update_params)
        render json: serialize_plant_marker(marker)
      end

      def destroy_plant_marker
        marker = Design::PlantMarker.find(params.require(:marker_id))
        Design::PlantRecord.where(marker_id: marker.id).update_all(marker_id: nil)
        marker.soft_delete!
        head :no_content
      end

      def create_plant_record
        project = find_project
        record = project.plant_records.create!(plant_record_params)
        render json: serialize_plant_record(record), status: :created
      end

      def update_plant_record
        record = Design::PlantRecord.find(params.require(:record_id))
        record.update!(plant_record_update_params)
        render json: serialize_plant_record(record)
      end

      def create_follow_up_visit
        project = find_project
        item = project.follow_up_visits.create!(follow_up_visit_params)
        render json: serialize_follow_up_visit(item), status: :created
      end

      def create_intervention
        project = find_project
        item = project.interventions.create!(intervention_params)
        render json: serialize_intervention(item), status: :created
      end

      def update_harvest_calendar
        project = find_project
        calendar = ensure_harvest_calendar(project)
        calendar.update!(months: update_calendar_months(calendar.months, params.require(:month).to_i, :harvests, params.require(:items)))

        render json: serialize_harvest_calendar(calendar)
      end

      def update_maintenance_calendar
        project = find_project
        calendar = ensure_maintenance_calendar(project)
        calendar.update!(months: update_calendar_months(calendar.months, params.require(:month).to_i, :tasks, params.require(:items)))

        render json: serialize_maintenance_calendar(calendar)
      end

      def search
        project = find_project
        query = params[:q].to_s.strip.downcase
        return render json: { query: query, results: [] } if query.blank?

        results = []

        search_targets = [
          [:project, project.name.to_s],
          [:project, project.address_display.to_s]
        ]
        project.quotes.find_each { |item| search_targets << [:quote, "#{item.title} #{item.client_comment}"] }
        project.documents.find_each { |item| search_targets << [:document, "#{item.name} #{item.category}"] }
        project.media_items.find_each { |item| search_targets << [:media, "#{item.caption} #{item.url}"] }
        project.annotations.find_each { |item| search_targets << [:annotation, item.content.to_s] }
        project.follow_up_visits.find_each { |item| search_targets << [:visit, item.notes.to_s] }
        project.interventions.find_each { |item| search_targets << [:intervention, item.notes.to_s] }
        project.plant_records.find_each { |item| search_targets << [:plant_record, "#{item.status} #{item.notes}"] }

        search_targets.each_with_index do |(kind, text), idx|
          next unless text.to_s.downcase.include?(query)

          results << {
            id: "#{kind}-#{idx}",
            kind: kind.to_s,
            excerpt: text.to_s.tr("\n", ' ')[0, 220]
          }
        end

        render json: { query: query, results: results.first(50) }
      end

      def create_quote
        project = find_project

        version = project.quotes.maximum(:version).to_i + 1
        quote = project.quotes.create!(
          version: version,
          status: 'draft',
          title: params[:title].presence || "Devis v#{version}",
          valid_until: params[:valid_until].presence || (Date.current + 30.days),
          vat_rate: params[:vat_rate] || 21
        )

        recalculate_quote_totals!(quote)

        render json: serialize_quote(quote.reload), status: :created
      end

      def update_quote
        quote = Design::Quote.find(params.require(:quote_id))
        quote.update!(params.permit(:title, :valid_until, :vat_rate, :status, :client_comment))
        recalculate_quote_totals!(quote)

        render json: serialize_quote(quote.reload)
      end

      def destroy_quote
        Design::Quote.find(params.require(:quote_id)).soft_delete!
        head :no_content
      end

      def send_quote
        quote = Design::Quote.find(params.require(:quote_id))
        quote.update!(status: 'sent')
        render json: serialize_quote(quote)
      end

      def create_quote_line
        quote = Design::Quote.find(params.require(:quote_id))
        line = quote.lines.create!(quote_line_params)
        line.update!(total: line.quantity.to_f * line.unit_price.to_f)
        recalculate_quote_totals!(quote)

        render json: serialize_quote_line(line.reload), status: :created
      end

      def update_quote_line
        line = Design::QuoteLine.find(params.require(:line_id))
        line.update!(quote_line_update_params)
        line.update!(total: line.quantity.to_f * line.unit_price.to_f)
        recalculate_quote_totals!(line.quote)

        render json: serialize_quote_line(line.reload)
      end

      def destroy_quote_line
        line = Design::QuoteLine.find(params.require(:line_id))
        quote = line.quote
        line.soft_delete!
        recalculate_quote_totals!(quote)

        head :no_content
      end

      def create_document
        project = find_project
        item = project.documents.create!(project_document_params.merge(uploaded_at: Time.current))

        render json: serialize_document(item), status: :created
      end

      def destroy_document
        Design::ProjectDocument.find(params.require(:document_id)).soft_delete!
        head :no_content
      end

      def create_media
        project = find_project
        item = project.media_items.create!(media_item_params.merge(uploaded_at: Time.current, taken_at: Time.current))

        render json: serialize_media_item(item), status: :created
      end

      def destroy_media
        Design::MediaItem.find(params.require(:media_id)).soft_delete!
        head :no_content
      end

      def create_meeting
        project = find_project
        meeting = project.meetings.create!(
          title: params.require(:title),
          starts_at: Time.zone.parse("#{params.require(:date)} #{params.require(:time)}"),
          duration_minutes: params[:duration] || 60,
          location: params[:location] || ''
        )

        render json: serialize_meeting(meeting), status: :created
      end

      def update_meeting
        meeting = Design::ProjectMeeting.find(params.require(:meeting_id))

        starts_at = if params[:date].present? || params[:time].present?
          date = params[:date].presence || meeting.starts_at.to_date.iso8601
          time = params[:time].presence || meeting.starts_at.strftime('%H:%M')
          Time.zone.parse("#{date} #{time}")
        else
          meeting.starts_at
        end

        meeting.update!(
          title: params[:title] || meeting.title,
          starts_at: starts_at,
          duration_minutes: params[:duration] || meeting.duration_minutes,
          location: params[:location] || meeting.location
        )

        render json: serialize_meeting(meeting)
      end

      def destroy_meeting
        Design::ProjectMeeting.find(params.require(:meeting_id)).soft_delete!
        head :no_content
      end

      def create_annotation
        project = find_project
        item = project.annotations.create!(annotation_params.merge(created_at: Time.current, updated_at: Time.current))

        render json: serialize_annotation(item), status: :created
      end

      def resolve_annotation
        item = Design::Annotation.find(params.require(:annotation_id))
        item.update!(resolved: true)
        render json: serialize_annotation(item)
      end

      def destroy_annotation
        Design::Annotation.find(params.require(:annotation_id)).soft_delete!
        head :no_content
      end

      # ── Design Task Lists & Tasks ──

      def create_design_task_list
        project = find_project
        task_list = project.task_lists.new(params.permit(:name, :position))
        if task_list.save
          render json: serialize_design_task_list(task_list), status: :created
        else
          render json: { error: task_list.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def update_design_task_list
        task_list = Design::TaskList.find(params.require(:id))
        if task_list.update(params.permit(:name, :position))
          render json: serialize_design_task_list(task_list)
        else
          render json: { error: task_list.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def destroy_design_task_list
        Design::TaskList.find(params.require(:id)).destroy!
        head :no_content
      end

      def create_design_task
        task_list = Design::TaskList.find(params.require(:task_list_id))
        task = task_list.tasks.new(design_task_params)
        if task.save
          render json: serialize_design_task(task), status: :created
        else
          render json: { error: task.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def update_design_task
        task = Design::Task.find(params.require(:id))
        if task.update(design_task_params)
          render json: serialize_design_task(task)
        else
          render json: { error: task.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def toggle_design_task
        task = Design::Task.find(params.require(:id))
        new_status = task.status == "completed" ? "pending" : "completed"
        task.update!(status: new_status)
        render json: serialize_design_task(task)
      end

      def destroy_design_task
        Design::Task.find(params.require(:id)).destroy!
        head :no_content
      end

      def client_portal
        project = find_project
        palette = ensure_palette(project)

        render json: {
          project: serialize_project(project),
          teamMembers: project.team_members.order(:assigned_at).map { |tm| serialize_team_member(tm) },
          documents: project.documents.order(uploaded_at: :desc).map { |item| serialize_document(item) },
          plantPalette: serialize_project_palette(palette),
          plantingPlan: serialize_planting_plan(ensure_planting_plan(project)),
          quotes: project.quotes.includes(:lines).order(version: :desc).map { |item| serialize_quote(item) },
          annotations: project.annotations.order(created_at: :desc).map { |item| serialize_annotation(item) },
          plantFollowUp: serialize_plant_follow_up(project),
          clientContributions: serialize_client_contribution(ensure_client_contribution(project)),
          harvestCalendar: serialize_harvest_calendar(ensure_harvest_calendar(project)),
          maintenanceCalendar: serialize_maintenance_calendar(ensure_maintenance_calendar(project)),
          autoHarvestCalendar: build_auto_harvest_calendar(palette),
          clientExpenses: serialize_client_expenses(project)
        }
      end

      def client_approve_quote
        quote = Design::Quote.find(params.require(:quote_id))
        quote.update!(status: 'approved', approved_at: Time.current, approved_by: params[:approved_by] || 'client', client_comment: params[:comment])

        render json: serialize_quote(quote)
      end

      def client_reject_quote
        quote = Design::Quote.find(params.require(:quote_id))
        quote.update!(status: 'rejected', client_comment: params.require(:comment))

        render json: serialize_quote(quote)
      end

      def client_submit_questionnaire
        project = find_project
        contribution = ensure_client_contribution(project)
        contribution.update!(terrain_questionnaire: questionnaire_payload)

        render json: serialize_client_contribution(contribution)
      end

      def client_add_wishlist_item
        project = find_project
        contribution = ensure_client_contribution(project)
        items = contribution.wishlist
        items << {
          id: SecureRandom.uuid,
          type: params.require(:item_type),
          description: params.require(:description),
          addedAt: Time.current.iso8601
        }
        contribution.update!(wishlist: items)

        render json: serialize_client_contribution(contribution)
      end

      def client_add_journal_entry
        project = find_project
        contribution = ensure_client_contribution(project)
        journals = contribution.plant_journal

        plant_id = params.require(:plant_id)
        journal = journals.find { |item| item['plantId'] == plant_id }

        unless journal
          journal = {
            'id' => SecureRandom.uuid,
            'plantId' => plant_id,
            'speciesName' => params[:species_name] || 'Plant',
            'varietyName' => params[:variety_name],
            'entries' => []
          }
          journals << journal
        end

        journal['entries'] << {
          'id' => SecureRandom.uuid,
          'date' => Date.current.iso8601,
          'text' => params.require(:text),
          'photos' => Array(params[:photos])
        }

        contribution.update!(plant_journal: journals)

        render json: serialize_client_contribution(contribution)
      end

      def generate_client_portal_link
        project = find_project
        token = project.ensure_client_portal_token!

        render json: {
          url: "#{request.base_url}/client/design/#{project.id}?token=#{token}",
          token: token
        }
      end

      private

      def require_client_portal_access
        return if current_member

        token = request.headers["X-Client-Token"].presence || params[:client_token]
        unless token.present?
          render json: { error: "Non autorise" }, status: :unauthorized
          return
        end

        expected_project_id = project_id_for_client_portal_check
        project = Design::Project.find_by(id: expected_project_id, client_portal_token: token)
        unless project
          render json: { error: "Lien invalide" }, status: :unauthorized
          return
        end
      end

      def project_id_for_client_portal_check
        return params[:project_id] if params[:project_id].present?
        quote = Design::Quote.find_by(id: params[:quote_id])
        quote&.project_id&.to_s
      end

      def find_project
        Design::Project.find(params.require(:project_id))
      end

      def full_project_payload(project, palette)
        planting_plan = ensure_planting_plan(project)

        {
          project: serialize_project(project),
          teamMembers: project.team_members.order(:assigned_at).map { |item| serialize_team_member(item) },
          timesheets: project.timesheets.order(date: :desc).map { |item| serialize_timesheet(item) },
          expenses: project.expenses.order(invoice_date: :desc).map { |item| serialize_expense(item) },
          siteAnalysis: serialize_site_analysis(project.site_analysis),
          plantPalette: serialize_project_palette(palette),
          plantingPlan: serialize_planting_plan(planting_plan),
          quotes: project.quotes.includes(:lines).order(version: :desc).map { |item| serialize_quote(item) },
          documents: project.documents.order(uploaded_at: :desc).map { |item| serialize_document(item) },
          mediaItems: project.media_items.order(uploaded_at: :desc).map { |item| serialize_media_item(item) },
          meetings: project.meetings.order(starts_at: :asc).map { |meeting| serialize_meeting(meeting) },
          annotations: project.annotations.order(created_at: :desc).map { |item| serialize_annotation(item) },
          plantFollowUp: serialize_plant_follow_up(project),
          clientContributions: serialize_client_contribution(ensure_client_contribution(project)),
          harvestCalendar: serialize_harvest_calendar(ensure_harvest_calendar(project)),
          maintenanceCalendar: serialize_maintenance_calendar(ensure_maintenance_calendar(project)),
          taskLists: project.task_lists.includes(:tasks).order(:position).map { |tl| serialize_design_task_list(tl) }
        }
      end

      def reporting_filters
        params.permit(:from, :to, :project_id, :client_id, :member_id, :group_by).to_h.symbolize_keys
      end

      def project_params
        params.permit(
          :name, :client_id, :client_name, :client_email, :client_phone, :place_id, :street, :number, :city, :postcode,
          :country_name, :latitude, :longitude, :area, :phase, :status, :start_date, :planting_date, :project_manager_id,
          :hours_planned, :hours_worked, :hours_billed, :hours_semos, :expenses_budget, :expenses_actual, :project_type,
          :acquisition_channel, client_interests: []
        )
      end

      def project_update_params
        params.permit(
          :name, :client_name, :client_email, :client_phone, :phase, :status, :street, :number, :city, :postcode,
          :country_name, :latitude, :longitude, :area, :project_type, :acquisition_channel, :google_photos_url, client_interests: []
        )
      end

      def team_member_params
        attrs = params.permit(:member_id, :member_name, :member_email, :member_avatar, :role, :is_paid)
        attrs[:member_id] = attrs[:member_id].to_s
        attrs[:assigned_at] = Time.current
        attrs
      end

      def timesheet_params
        p = params.permit(:member_id, :member_name, :date, :hours, :phase, :mode, :travel_km, :notes, :details, :service_type_id)
        p[:service_type_id] = nil if p[:service_type_id].to_s.blank?
        p
      end

      def timesheet_update_params
        p = params.permit(:date, :hours, :phase, :mode, :travel_km, :notes, :details, :service_type_id)
        p[:service_type_id] = nil if p[:service_type_id].to_s.blank?
        p
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

      def site_analysis_params
        params.permit(
          :water_access,
          climate: {},
          geomorphology: {},
          water: {},
          biodiversity: {},
          socio_economic: {},
          access: {},
          access_data: {},
          vegetation: {},
          microclimate: {},
          built_environment: {},
          buildings: {},
          zoning: {},
          soil: {},
          aesthetics: {},
          client_observations: {},
          client_photos: [],
          client_usage_map: [],
          zoning_categories: []
        )
      end

      def normalized_site_analysis_params
        attrs = site_analysis_params.to_h.deep_symbolize_keys

        attrs[:vegetation] ||= attrs.delete(:biodiversity)
        attrs[:buildings] ||= attrs.delete(:built_environment)
        attrs[:access_data] ||= attrs.delete(:access)

        zoning = attrs[:zoning].is_a?(Hash) ? attrs[:zoning].deep_dup : {}
        zoning_categories = Array(attrs[:zoning_categories]).presence || Array(zoning['categories'] || zoning[:categories])
        zoning['categories'] = zoning_categories if zoning_categories.any?

        attrs[:zoning] = zoning
        attrs[:zoning_categories] = zoning_categories

        attrs
      end

      def palette_item_params
        params.permit(:species_id, :species_name, :common_name, :variety_id, :variety_name, :layer, :quantity, :unit_price, :notes, harvest_months: [], harvest_products: [])
      end

      def palette_item_update_params
        params.permit(:layer, :quantity, :unit_price, :notes)
      end

      def planting_plan_params
        params.permit(:image_url, :layout)
      end

      def plant_marker_params
        params.permit(:palette_item_id, :x, :y, :species_name)
      end

      def plant_marker_update_params
        params.permit(:x, :y, :species_name, :palette_item_id, :diameter_cm)
      end

      def plant_record_params
        params.permit(:marker_id, :palette_item_id, :status, :health_score, :notes)
      end

      def plant_record_update_params
        params.permit(:status, :health_score, :notes)
      end

      def follow_up_visit_params
        params.permit(:date, :visit_type, :notes, photos: [])
      end

      def intervention_params
        params.permit(:plant_record_id, :date, :intervention_type, :notes)
      end

      def quote_line_params
        params.permit(:description, :quantity, :unit, :unit_price)
      end

      def quote_line_update_params
        params.permit(:description, :quantity, :unit, :unit_price)
      end

      def project_document_params
        params.permit(:category, :name, :url, :size, :uploaded_by)
      end

      def media_item_params
        params.permit(:media_type, :url, :thumbnail_url, :caption, :uploaded_by)
      end

      def annotation_params
        params.permit(:document_id, :x, :y, :author_id, :author_name, :author_type, :content, :resolved)
      end

      def questionnaire_payload
        {
          completedAt: Time.current.iso8601,
          responses: {
            sunObservations: params[:sun_observations].to_s,
            wetAreas: params[:wet_areas].to_s,
            windPatterns: params[:wind_patterns].to_s,
            soilHistory: params[:soil_history].to_s,
            existingWildlife: params[:existing_wildlife].to_s
          }
        }
      end

      def apply_template_defaults(project, template)
        project.template = template
        project.hours_planned = template.suggested_hours if project.hours_planned.to_i.zero?
        project.expenses_budget = template.suggested_budget if project.expenses_budget.to_f.zero?
      end

      def build_stats(projects)
        now = Time.current
        beginning_of_month = now.beginning_of_month
        beginning_of_year = now.beginning_of_year

        active_projects = projects.count { |project| project.status == 'active' }
        pending_projects = projects.count { |project| project.status == 'pending' }

        monthly_hours = projects.sum { |project| project.updated_at >= beginning_of_month ? project.hours_worked : 0 }
        yearly_revenue = projects.sum { |project| project.updated_at >= beginning_of_year ? project.expenses_actual.to_f : 0 }

        conversion_rate = if projects.empty?
          0.0
        else
          completed = projects.count { |project| project.status == 'completed' }
          completed.to_f / projects.size
        end

        upcoming_meetings = Design::ProjectMeeting.includes(:project).where(project_id: Design::Project.select(:id)).where('starts_at >= ?', Time.current).order(starts_at: :asc).limit(6).map { |meeting| serialize_upcoming_meeting(meeting) }

        {
          activeProjects: active_projects,
          pendingProjects: pending_projects,
          totalProjects: projects.size,
          totalHoursThisMonth: monthly_hours,
          totalRevenueThisYear: yearly_revenue,
          quoteConversionRate: conversion_rate,
          upcomingMeetings: upcoming_meetings
        }
      end

      def ensure_palette(project)
        project.palette || project.create_palette!
      end

      def ensure_planting_plan(project)
        project.planting_plan || project.create_planting_plan!(image_url: '', layout: 'split-3-4-1-4')
      end

      def ensure_client_contribution(project)
        project.client_contribution || project.create_client_contribution!(client_id: project.client_id, terrain_questionnaire: {}, wishlist: [], plant_journal: [])
      end

      def ensure_harvest_calendar(project)
        project.harvest_calendar || project.create_harvest_calendar!(months: default_months)
      end

      def ensure_maintenance_calendar(project)
        project.maintenance_calendar || project.create_maintenance_calendar!(months: default_months)
      end

      def update_calendar_months(months, month_number, key, items)
        source = months.map { |item| item.deep_dup }
        target = source.find { |item| item['month'].to_i == month_number }
        return source unless target

        target[key.to_s] = items
        source
      end

      def default_months
        [
          { month: 1, name: 'Janvier', tasks: [], harvests: [] },
          { month: 2, name: 'Février', tasks: [], harvests: [] },
          { month: 3, name: 'Mars', tasks: [], harvests: [] },
          { month: 4, name: 'Avril', tasks: [], harvests: [] },
          { month: 5, name: 'Mai', tasks: [], harvests: [] },
          { month: 6, name: 'Juin', tasks: [], harvests: [] },
          { month: 7, name: 'Juillet', tasks: [], harvests: [] },
          { month: 8, name: 'Août', tasks: [], harvests: [] },
          { month: 9, name: 'Septembre', tasks: [], harvests: [] },
          { month: 10, name: 'Octobre', tasks: [], harvests: [] },
          { month: 11, name: 'Novembre', tasks: [], harvests: [] },
          { month: 12, name: 'Décembre', tasks: [], harvests: [] }
        ]
      end

      def build_auto_harvest_calendar(palette)
        items = palette.items.where.not(species_id: [nil, ''])
        species_ids = items.pluck(:species_id).uniq
        species_map = Plant::Species.where(id: species_ids).index_by { |s| s.id.to_s }

        items.filter_map do |item|
          species = species_map[item.species_id.to_s]
          next unless species

          months = Array(species.harvest_months).filter_map { |m| MONTH_ABBR_TO_NUM[m.to_s.downcase] }.sort
          next if months.empty?

          {
            paletteItemId: item.id.to_s,
            speciesName: item.species_name,
            commonName: item.common_name,
            varietyName: item.variety_name,
            layer: item.layer,
            harvestMonths: months,
            edibleParts: Array(species.edible_parts),
            fruitingMonths: Array(species.fruiting_months).filter_map { |m| MONTH_ABBR_TO_NUM[m.to_s.downcase] }.sort,
            floweringMonths: Array(species.flowering_months).filter_map { |m| MONTH_ABBR_TO_NUM[m.to_s.downcase] }.sort
          }
        end
      end

      def serialize_client_expenses(project)
        billable = project.expenses.where(billable_to_client: true)
        grouped = billable.group_by(&:category).map do |category, items|
          { category: category.presence || 'Autres', subtotal: items.sum { |e| e.total_incl_vat.to_f }.round(2), count: items.size }
        end.sort_by { |g| -g[:subtotal] }
        { categories: grouped, total: billable.sum(:total_incl_vat).to_f.round(2) }
      end

      def recalculate_quote_totals!(quote)
        subtotal = quote.lines.sum('total')
        vat_amount = subtotal.to_f * (quote.vat_rate.to_f / 100.0)
        total = subtotal.to_f + vat_amount

        quote.update!(subtotal: subtotal, vat_amount: vat_amount, total: total)
      end

      def scoped_reporting_projects
        scope = Design::Project
        case params[:period].to_s
        when '30d' then scope = scope.where('updated_at >= ?', 30.days.ago)
        when '90d' then scope = scope.where('updated_at >= ?', 90.days.ago)
        when '12m' then scope = scope.where('updated_at >= ?', 12.months.ago)
        end

        scope = scope.where(id: params[:project_id]) if params[:project_id].present?
        scope = scope.where(client_name: params[:client]) if params[:client].present?
        scope.includes(:quotes, :timesheets, :expenses, :team_members).to_a
      end

      def reporting_project_row(project)
        revenue = project.quotes.where(status: %w[sent approved]).sum(:total).to_f
        timesheets = project.timesheets
        timesheets = timesheets.where(member_id: params[:member_id]) if params[:member_id].present?
        hours = timesheets.sum(:hours).to_f

        labor_cost = hours * 45.0
        expenses = project.expenses.sum(:total_incl_vat).to_f
        costs = expenses + labor_cost
        margin = revenue - costs
        margin_pct = revenue.positive? ? ((margin / revenue) * 100.0) : 0.0
        revenue_per_hour = hours.positive? ? revenue / hours : 0.0
        cost_per_hour = hours.positive? ? costs / hours : 0.0

        month_revenue = project.quotes.where('created_at >= ?', 30.days.ago).where(status: %w[sent approved]).sum(:total).to_f
        prev_month_revenue = project.quotes.where(created_at: 60.days.ago..30.days.ago).where(status: %w[sent approved]).sum(:total).to_f
        trend = prev_month_revenue.positive? ? (((month_revenue - prev_month_revenue) / prev_month_revenue) * 100.0) : 0.0

        {
          projectId: project.id.to_s,
          projectName: project.name,
          clientName: project.client_name.to_s,
          revenue: revenue.round(2),
          costs: costs.round(2),
          margin: margin.round(2),
          marginPct: margin_pct.round(1),
          hours: hours.round(1),
          revenuePerHour: revenue_per_hour.round(2),
          costPerHour: cost_per_hour.round(2),
          trend: trend.round(1),
          alertNegativeMargin: margin.negative?,
          alertCostOverrun: project.expenses_budget.to_f.positive? && expenses > project.expenses_budget.to_f
        }
      end

      def build_reporting_series(projects)
        month_keys = (0..5).to_a.reverse.map { |i| (Date.current - i.months).strftime('%Y-%m') }
        month_keys.map do |key|
          from = Date.parse("#{key}-01").beginning_of_month
          to = from.end_of_month
          revenue = projects.sum { |p| p.quotes.where(created_at: from..to, status: %w[sent approved]).sum(:total).to_f }
          costs = projects.sum { |p| p.expenses.where(invoice_date: from..to).sum(:total_incl_vat).to_f }
          {
            period: from.strftime('%b %y'),
            revenue: revenue.round(2),
            costs: costs.round(2),
            margin: (revenue - costs).round(2)
          }
        end
      end

      def build_reporting_summary(rows)
        revenue = rows.sum { |r| r[:revenue] }
        costs = rows.sum { |r| r[:costs] }
        margin = revenue - costs
        hours = rows.sum { |r| r[:hours] }
        {
          revenue: revenue.round(2),
          costs: costs.round(2),
          marginValue: margin.round(2),
          marginPct: revenue.positive? ? ((margin / revenue) * 100.0).round(1) : 0.0,
          totalHours: hours.round(1),
          revenuePerHour: hours.positive? ? (revenue / hours).round(2) : 0.0
        }
      end

      def build_member_productivity(projects)
        grouped = Hash.new { |h, k| h[k] = { memberId: k, memberName: 'Membre', hours: 0.0, revenue: 0.0 } }
        projects.each do |project|
          revenue = project.quotes.where(status: %w[sent approved]).sum(:total).to_f
          total_hours = project.timesheets.sum(:hours).to_f
          project.timesheets.each do |t|
            member = grouped[t.member_id.to_s]
            member[:memberName] = t.member_name if t.member_name.present?
            member[:hours] += t.hours.to_f
            member[:revenue] += total_hours.positive? ? (revenue * (t.hours.to_f / total_hours)) : 0.0
          end
        end

        grouped.values.map do |item|
          item[:hours] = item[:hours].round(1)
          item[:revenue] = item[:revenue].round(2)
          item[:revenuePerHour] = item[:hours].positive? ? (item[:revenue] / item[:hours]).round(2) : 0.0
          item
        end.sort_by { |m| -m[:hours] }
      end

      def build_reporting_alerts(rows)
        alerts = []
        rows.each do |row|
          if row[:alertNegativeMargin]
            alerts << { level: 'high', kind: 'negative_margin', projectId: row[:projectId], message: "Marge négative sur #{row[:projectName]}" }
          end
          if row[:alertCostOverrun]
            alerts << { level: 'medium', kind: 'cost_overrun', projectId: row[:projectId], message: "Dépassement de coûts sur #{row[:projectName]}" }
          end
        end
        alerts.first(12)
      end

      def reporting_filter_options
        {
          period: params[:period].presence || '12m',
          groupBy: params[:group_by].presence || 'month',
          projects: Design::Project.order(:name).pluck(:id, :name).map { |id, name| { id: id.to_s, name: name } },
          clients: Design::Project.distinct.where.not(client_name: [nil, '']).order(:client_name).pluck(:client_name),
          members: Design::ProjectTeamMember.distinct.order(:member_name).pluck(:member_id, :member_name).map { |id, name| { id: id.to_s, name: name.presence || 'Membre' } }
        }
      end

      def serialize_project(project, task_count: nil)
        {
          id: project.id.to_s,
          name: project.name,
          clientId: project.client_id,
          clientName: project.client_name,
          clientEmail: project.client_email,
          clientPhone: project.client_phone,
          placeId: project.place_id,
          street: project.street,
          number: project.number,
          city: project.city,
          postcode: project.postcode,
          countryName: project.country_name,
          address: project.address_display,
          coordinates: { lat: project.latitude.to_f, lng: project.longitude.to_f },
          area: project.area,
          phase: project.phase,
          status: project.status,
          startDate: project.start_date&.iso8601,
          plantingDate: project.planting_date&.iso8601,
          projectManagerId: project.project_manager_id,
          projectType: project.project_type.presence,
          projectTypeLabel: PROJECT_TYPE_LABELS[project.project_type],
          clientInterests: project.client_interests || [],
          clientInterestsLabels: Array(project.client_interests).map { |interest| CLIENT_INTEREST_LABELS[interest] || interest },
          acquisitionChannel: project.acquisition_channel.presence,
          acquisitionChannelLabel: ACQUISITION_CHANNEL_LABELS[project.acquisition_channel],
          budget: {
            hoursPlanned: project.hours_planned,
            hoursWorked: project.hours_worked,
            hoursBilled: project.hours_billed,
            hoursSemos: project.hours_semos,
            expensesBudget: project.expenses_budget.to_f,
            expensesActual: project.expenses_actual.to_f
          },
          templateId: project.template_id&.to_s,
          googlePhotosUrl: project.google_photos_url.presence,
          taskCount: task_count || Design::Task.joins(:task_list).where(design_task_lists: { project_id: project.id }).count,
          createdAt: project.created_at.iso8601,
          updatedAt: project.updated_at.iso8601
        }
      end

      def serialize_template(template)
        {
          id: template.id.to_s,
          name: template.name,
          description: template.description,
          defaultPhases: template.default_phases,
          suggestedHours: template.suggested_hours,
          suggestedBudget: template.suggested_budget.to_f
        }
      end

      def serialize_meeting(meeting)
        {
          id: meeting.id.to_s,
          projectId: meeting.project_id.to_s,
          title: meeting.title,
          date: meeting.starts_at.to_date.iso8601,
          time: meeting.starts_at.strftime('%H:%M'),
          duration: meeting.duration_minutes,
          location: meeting.location,
          attendees: [],
          notes: '',
          aiSummary: '',
          createdAt: meeting.created_at.iso8601,
          updatedAt: meeting.updated_at.iso8601
        }
      end

      def serialize_upcoming_meeting(meeting)
        {
          id: meeting.id.to_s,
          projectId: meeting.project_id.to_s,
          projectName: meeting.project.name,
          title: meeting.title,
          date: meeting.starts_at.to_date.iso8601,
          time: meeting.starts_at.strftime('%H:%M')
        }
      end

      def serialize_team_member(item)
        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          memberId: item.member_id,
          memberName: item.member_name,
          memberEmail: item.member_email,
          memberAvatar: item.member_avatar,
          role: item.role,
          isPaid: item.is_paid,
          assignedAt: item.assigned_at.iso8601
        }
      end

      def serialize_timesheet(item)
        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          memberId: item.member_id,
          memberName: item.member_name,
          date: item.date.iso8601,
          hours: item.hours.to_f,
          phase: item.phase,
          mode: item.mode,
          travelKm: item.travel_km,
          notes: item.notes,
          details: item.details.to_s,
          serviceTypeId: item.service_type_id&.to_s,
          serviceTypeLabel: item.service_type&.label,
          billed: item.billed,
          trainingId: item.training_id&.to_s,
          notionId: item.notion_id,
          notionCreatedAt: item.notion_created_at&.iso8601,
          notionUpdatedAt: item.notion_updated_at&.iso8601,
          createdAt: item.created_at.iso8601,
          updatedAt: item.updated_at.iso8601
        }
      end

      def serialize_expense(item)
        doc_url = item.document.attached? ? Rails.application.routes.url_helpers.rails_blob_url(item.document, only_path: true) : nil
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

      def serialize_site_analysis(item)
        return nil unless item

        zoning_categories = item.zoning_categories_list

        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          updatedAt: item.updated_at.iso8601,

          # Canonical API contract
          climate: item.climate,
          geomorphology: item.geomorphology,
          water: item.water,
          biodiversity: item.biodiversity,
          socio_economic: item.socio_economic,
          access: item.access,
          microclimate: item.microclimate,
          built_environment: item.built_environment,
          zoning: item.zoning,
          soil: item.soil,
          aesthetics: item.aesthetics,

          # Backward compatible aliases
          socioEconomic: item.socio_economic,
          accessData: item.access,
          vegetation: item.biodiversity,
          buildings: item.built_environment,
          waterAccess: item.water_access,
          zoningCategories: zoning_categories,
          zoningCategoriesLabels: zoning_categories.map { |category| ZONING_CATEGORY_LABELS[category] || category },
          clientObservations: item.client_observations,
          clientPhotos: item.client_photos,
          clientUsageMap: item.client_usage_map
        }
      end

      def serialize_project_palette(palette)
        items = palette.items.order(:id).map { |item| serialize_palette_item(item) }

        totals = {
          totalPlants: items.sum { |item| item[:quantity].to_i },
          totalCost: items.sum { |item| item[:quantity].to_i * item[:unitPrice].to_f },
          byLayer: {}
        }

        Design::ProjectPaletteItem::LAYERS.each do |layer|
          layer_items = items.select { |item| item[:layer] == layer }
          totals[:byLayer][layer] = {
            count: layer_items.sum { |item| item[:quantity].to_i },
            cost: layer_items.sum { |item| item[:quantity].to_i * item[:unitPrice].to_f }
          }
        end

        {
          id: palette.id.to_s,
          projectId: palette.project_id.to_s,
          updatedAt: palette.updated_at.iso8601,
          items: items,
          totals: totals
        }
      end

      def serialize_palette_item(item)
        {
          id: item.id.to_s,
          speciesId: item.species_id,
          speciesName: item.species_name,
          commonName: item.common_name,
          varietyId: item.variety_id,
          varietyName: item.variety_name,
          layer: item.layer,
          quantity: item.quantity,
          unitPrice: item.unit_price.to_f,
          notes: item.notes,
          harvestMonths: item.harvest_months,
          harvestProducts: item.harvest_products,
          linkedToSpecies: species_linked_to_db?(item.species_id)
        }
      end

      def species_linked_to_db?(species_id)
        return false if species_id.blank?
        Plant::Species.exists?(id: species_id)
      rescue ArgumentError, ActiveRecord::StatementInvalid
        false
      end

      def serialize_quote(quote)
        {
          id: quote.id.to_s,
          projectId: quote.project_id.to_s,
          version: quote.version,
          status: quote.status,
          title: quote.title,
          createdAt: quote.created_at.iso8601,
          validUntil: quote.valid_until.iso8601,
          approvedAt: quote.approved_at&.iso8601,
          approvedBy: quote.approved_by,
          clientComment: quote.client_comment,
          lines: quote.lines.order(:id).map { |line| serialize_quote_line(line) },
          subtotal: quote.subtotal.to_f,
          vatRate: quote.vat_rate.to_f,
          vatAmount: quote.vat_amount.to_f,
          total: quote.total.to_f
        }
      end

      def serialize_quote_line(line)
        {
          id: line.id.to_s,
          description: line.description,
          quantity: line.quantity.to_f,
          unit: line.unit,
          unitPrice: line.unit_price.to_f,
          total: line.total.to_f
        }
      end

      def serialize_document(item)
        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          category: item.category,
          name: item.name,
          url: item.url,
          size: item.size,
          uploadedAt: item.uploaded_at.iso8601,
          uploadedBy: item.uploaded_by
        }
      end

      def serialize_media_item(item)
        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          type: item.media_type,
          url: item.url,
          thumbnailUrl: item.thumbnail_url,
          caption: item.caption,
          takenAt: item.taken_at.iso8601,
          uploadedAt: item.uploaded_at.iso8601,
          uploadedBy: item.uploaded_by
        }
      end

      def serialize_annotation(item)
        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          documentId: item.document_id,
          x: item.x.to_f,
          y: item.y.to_f,
          authorId: item.author_id,
          authorName: item.author_name,
          authorType: item.author_type,
          content: item.content,
          createdAt: item.created_at.iso8601,
          resolved: item.resolved
        }
      end

      def design_task_params
        params.permit(:name, :status, :due_date, :assignee_id, :assignee_name, :notes, :position)
      end

      def serialize_design_task_list(tl)
        {
          id: tl.id.to_s,
          name: tl.name,
          position: tl.position,
          projectId: tl.project_id.to_s,
          tasks: tl.tasks.order(:position, :created_at).map { |t| serialize_design_task(t) }
        }
      end

      def serialize_design_task(t)
        {
          id: t.id.to_s,
          name: t.name,
          status: t.status,
          dueDate: t.due_date&.iso8601,
          assigneeId: t.assignee_id&.to_s,
          assigneeName: t.assignee_name,
          notes: t.notes,
          position: t.position,
          completed: t.status == "completed",
          taskListId: t.task_list_id.to_s,
          createdAt: t.created_at.iso8601
        }
      end

      def serialize_client_contribution(item)
        {
          projectId: item.project_id.to_s,
          clientId: item.client_id,
          terrainQuestionnaire: item.terrain_questionnaire.presence || { completedAt: nil, responses: {} },
          wishlist: item.wishlist,
          plantJournal: item.plant_journal
        }
      end

      def serialize_harvest_calendar(item)
        {
          projectId: item.project_id.to_s,
          months: item.months.map { |month| month.slice('month', 'name', 'harvests') }
        }
      end

      def serialize_maintenance_calendar(item)
        {
          projectId: item.project_id.to_s,
          months: item.months.map { |month| month.slice('month', 'name', 'tasks') }
        }
      end

      def serialize_planting_plan(item)
        bg_url = if item.background_image.attached?
          Rails.application.routes.url_helpers.rails_blob_url(item.background_image, only_path: true)
        else
          item.image_url.presence
        end

        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          imageUrl: bg_url,
          imageWidth: 1920,
          imageHeight: 1080,
          scale: 1,
          scaleData: item.scale_data,
          layout: item.layout,
          markers: item.markers.includes(:palette_item).where(deleted_at: nil).order(:number).map { |marker| serialize_plant_marker(marker) },
          updatedAt: item.updated_at.iso8601
        }
      end

      def serialize_plant_marker(item)
        {
          id: item.id.to_s,
          plantingPlanId: item.planting_plan_id.to_s,
          paletteItemId: item.palette_item_id&.to_s,
          number: item.number,
          x: item.x.to_f,
          y: item.y.to_f,
          speciesName: item.species_name,
          varietyName: item.palette_item&.variety_name,
          diameterCm: item.diameter_cm
        }
      end

      def serialize_plant_follow_up(project)
        {
          plantRecords: project.plant_records.order(updated_at: :desc).map { |item| serialize_plant_record(item) },
          followUpVisits: project.follow_up_visits.order(date: :desc).map { |item| serialize_follow_up_visit(item) },
          interventions: project.interventions.order(date: :desc).map { |item| serialize_intervention(item) }
        }
      end

      def serialize_plant_record(item)
        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          markerId: item.marker_id&.to_s,
          paletteItemId: item.palette_item_id&.to_s,
          status: item.status,
          healthScore: item.health_score,
          notes: item.notes,
          updatedAt: item.updated_at.iso8601
        }
      end

      def serialize_follow_up_visit(item)
        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          date: item.date.iso8601,
          type: item.visit_type,
          notes: item.notes,
          photos: item.photos
        }
      end

      def serialize_intervention(item)
        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          plantRecordId: item.plant_record_id&.to_s,
          date: item.date.iso8601,
          type: item.intervention_type,
          notes: item.notes
        }
      end

      def map_strate_to_layer(strate)
        {
          'aquatic' => 'ground-cover',
          'groundCover' => 'ground-cover',
          'herbaceous' => 'herbaceous',
          'climbers' => 'vine',
          'shrubs' => 'shrub',
          'trees' => 'canopy'
        }.fetch(strate.to_s, 'shrub')
      end

      def map_layer_to_strate(layer)
        {
          'canopy' => 'trees',
          'sub-canopy' => 'trees',
          'shrub' => 'shrubs',
          'herbaceous' => 'herbaceous',
          'ground-cover' => 'groundCover',
          'vine' => 'climbers',
          'root' => 'herbaceous'
        }.fetch(layer.to_s, 'shrubs')
      end

      def target_latin_name(target_type, target_id)
        case target_type.to_s
        when 'genus'
          Plant::Genus.where(id: target_id).pick(:latin_name) || "Genus ##{target_id}"
        when 'species'
          Plant::Species.where(id: target_id).pick(:latin_name) || "Species ##{target_id}"
        when 'variety'
          Plant::Variety.where(id: target_id).pick(:latin_name) || "Variety ##{target_id}"
        else
          "Plant ##{target_id}"
        end
      end
    end
  end
end
