module Api
  module V1
    class DesignStudioController < BaseController
      CLIENT_PORTAL_ACTIONS = %i[
        client_portal client_approve_quote client_reject_quote
        client_submit_questionnaire client_add_wishlist_item client_add_journal_entry
      ].freeze

      skip_before_action :require_authentication, only: CLIENT_PORTAL_ACTIONS
      before_action :require_effective_member, except: CLIENT_PORTAL_ACTIONS
      before_action :require_client_portal_access, only: CLIENT_PORTAL_ACTIONS
      def index
        projects = Design::Project.order(updated_at: :desc)
        templates = Design::ProjectTemplate.order(:name)

        render json: {
          projects: projects.map { |project| serialize_project(project) },
          stats: build_stats(projects),
          templates: templates.map { |template| serialize_template(template) }
        }
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
        find_project.soft_delete!
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
        item = project.team_members.create!(team_member_params)
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
        item.assign_attributes(site_analysis_params)
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

      def upsert_planting_plan
        project = find_project
        plan = ensure_planting_plan(project)
        plan.update!(planting_plan_params)

        render json: serialize_planting_plan(plan)
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
          [:project, project.address.to_s]
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

      def client_portal
        project = find_project

        render json: {
          project: serialize_project(project),
          documents: project.documents.order(uploaded_at: :desc).map { |item| serialize_document(item) },
          plantPalette: serialize_project_palette(ensure_palette(project)),
          plantingPlan: serialize_planting_plan(ensure_planting_plan(project)),
          quotes: project.quotes.order(version: :desc).map { |item| serialize_quote(item) },
          annotations: project.annotations.order(created_at: :desc).map { |item| serialize_annotation(item) },
          plantFollowUp: serialize_plant_follow_up(project),
          clientContributions: serialize_client_contribution(ensure_client_contribution(project)),
          harvestCalendar: serialize_harvest_calendar(ensure_harvest_calendar(project)),
          maintenanceCalendar: serialize_maintenance_calendar(ensure_maintenance_calendar(project))
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
        token = Rails.application.message_verifier(:client_portal).generate(
          { project_id: project.id.to_s },
          purpose: :client_portal_access
        )

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

        begin
          data = Rails.application.message_verifier(:client_portal).verify(token, purpose: :client_portal_access)
          data = data.with_indifferent_access if data.respond_to?(:with_indifferent_access)
          expected_project_id = project_id_for_client_portal_check
          token_project_id = (data["project_id"] || data[:project_id])&.to_s
          if expected_project_id.present? && token_project_id != expected_project_id
            render json: { error: "Token invalide pour ce projet" }, status: :unauthorized
          end
        rescue ActiveSupport::MessageVerifier::InvalidSignature
          render json: { error: "Lien invalide" }, status: :unauthorized
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
          maintenanceCalendar: serialize_maintenance_calendar(ensure_maintenance_calendar(project))
        }
      end

      def project_params
        params.permit(:name, :client_id, :client_name, :client_email, :client_phone, :place_id, :address, :latitude, :longitude, :area, :phase, :status, :start_date, :planting_date, :project_manager_id, :hours_planned, :hours_worked, :hours_billed, :hours_semos, :expenses_budget, :expenses_actual)
      end

      def project_update_params
        params.permit(:name, :phase, :status, :address, :area)
      end

      def team_member_params
        attrs = params.permit(:member_id, :member_name, :member_email, :member_avatar, :role, :is_paid)
        attrs[:assigned_at] = Time.current
        attrs
      end

      def timesheet_params
        params.permit(:member_id, :member_name, :date, :hours, :phase, :mode, :travel_km, :notes)
      end

      def timesheet_update_params
        params.permit(:date, :hours, :phase, :mode, :travel_km, :notes)
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
        params.permit(climate: {}, geomorphology: {}, water: {}, socio_economic: {}, access_data: {}, vegetation: {}, microclimate: {}, buildings: {}, soil: {}, client_observations: {}, client_photos: [], client_usage_map: [])
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
        params.permit(:x, :y, :species_name, :palette_item_id)
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

      def recalculate_quote_totals!(quote)
        subtotal = quote.lines.sum('total')
        vat_amount = subtotal.to_f * (quote.vat_rate.to_f / 100.0)
        total = subtotal.to_f + vat_amount

        quote.update!(subtotal: subtotal, vat_amount: vat_amount, total: total)
      end

      def serialize_project(project)
        {
          id: project.id.to_s,
          name: project.name,
          clientId: project.client_id,
          clientName: project.client_name,
          clientEmail: project.client_email,
          clientPhone: project.client_phone,
          placeId: project.place_id,
          address: project.address,
          coordinates: { lat: project.latitude.to_f, lng: project.longitude.to_f },
          area: project.area,
          phase: project.phase,
          status: project.status,
          startDate: project.start_date&.iso8601,
          plantingDate: project.planting_date&.iso8601,
          projectManagerId: project.project_manager_id,
          budget: {
            hoursPlanned: project.hours_planned,
            hoursWorked: project.hours_worked,
            hoursBilled: project.hours_billed,
            hoursSemos: project.hours_semos,
            expensesBudget: project.expenses_budget.to_f,
            expensesActual: project.expenses_actual.to_f
          },
          templateId: project.template_id&.to_s,
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
          notes: item.notes
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

      def serialize_site_analysis(item)
        return nil unless item

        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          updatedAt: item.updated_at.iso8601,
          climate: item.climate,
          geomorphology: item.geomorphology,
          water: item.water,
          socioEconomic: item.socio_economic,
          access: item.access_data,
          vegetation: item.vegetation,
          microclimate: item.microclimate,
          buildings: item.buildings,
          soil: item.soil,
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
          harvestProducts: item.harvest_products
        }
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
        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          imageUrl: item.image_url,
          imageWidth: 1920,
          imageHeight: 1080,
          scale: 1,
          layout: item.layout,
          markers: item.markers.order(:number).map { |marker| serialize_plant_marker(marker) },
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
          speciesName: item.species_name
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
