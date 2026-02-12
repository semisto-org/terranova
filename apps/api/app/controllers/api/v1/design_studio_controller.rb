module Api
  module V1
    class DesignStudioController < ApplicationController
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
        find_project.destroy!
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
        project.team_members.find(params.require(:member_id)).destroy!
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
        Design::ProjectTimesheet.find(params.require(:timesheet_id)).destroy!
        head :no_content
      end

      def create_expense
        project = find_project
        item = project.expenses.create!(expense_params)
        project.increment!(:expenses_actual, item.amount.to_f)
        render json: serialize_expense(item), status: :created
      end

      def update_expense
        item = Design::Expense.find(params.require(:expense_id))
        item.update!(expense_update_params)
        render json: serialize_expense(item)
      end

      def destroy_expense
        Design::Expense.find(params.require(:expense_id)).destroy!
        head :no_content
      end

      def approve_expense
        item = Design::Expense.find(params.require(:expense_id))
        item.update!(status: 'approved')
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
        Design::ProjectPaletteItem.find(params.require(:item_id)).destroy!
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
        Design::Quote.find(params.require(:quote_id)).destroy!
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
        line.destroy!
        recalculate_quote_totals!(quote)

        head :no_content
      end

      def create_document
        project = find_project
        item = project.documents.create!(project_document_params.merge(uploaded_at: Time.current))

        render json: serialize_document(item), status: :created
      end

      def destroy_document
        Design::ProjectDocument.find(params.require(:document_id)).destroy!
        head :no_content
      end

      def create_media
        project = find_project
        item = project.media_items.create!(media_item_params.merge(uploaded_at: Time.current, taken_at: Time.current))

        render json: serialize_media_item(item), status: :created
      end

      def destroy_media
        Design::MediaItem.find(params.require(:media_id)).destroy!
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
        Design::ProjectMeeting.find(params.require(:meeting_id)).destroy!
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
        Design::Annotation.find(params.require(:annotation_id)).destroy!
        head :no_content
      end

      def client_portal
        project = find_project

        render json: {
          project: serialize_project(project),
          documents: project.documents.order(uploaded_at: :desc).map { |item| serialize_document(item) },
          plantPalette: serialize_project_palette(ensure_palette(project)),
          plantingPlan: nil,
          quotes: project.quotes.order(version: :desc).map { |item| serialize_quote(item) },
          annotations: project.annotations.order(created_at: :desc).map { |item| serialize_annotation(item) },
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

      private

      def find_project
        Design::Project.find(params.require(:project_id))
      end

      def full_project_payload(project, palette)
        {
          project: serialize_project(project),
          teamMembers: project.team_members.order(:assigned_at).map { |item| serialize_team_member(item) },
          timesheets: project.timesheets.order(date: :desc).map { |item| serialize_timesheet(item) },
          expenses: project.expenses.order(date: :desc).map { |item| serialize_expense(item) },
          siteAnalysis: serialize_site_analysis(project.site_analysis),
          plantPalette: serialize_project_palette(palette),
          plantingPlan: nil,
          quotes: project.quotes.includes(:lines).order(version: :desc).map { |item| serialize_quote(item) },
          documents: project.documents.order(uploaded_at: :desc).map { |item| serialize_document(item) },
          mediaItems: project.media_items.order(uploaded_at: :desc).map { |item| serialize_media_item(item) },
          meetings: project.meetings.order(starts_at: :asc).map { |meeting| serialize_meeting(meeting) },
          annotations: project.annotations.order(created_at: :desc).map { |item| serialize_annotation(item) },
          plantFollowUp: nil,
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
        params.permit(:date, :amount, :category, :description, :phase, :member_id, :member_name, :receipt_url, :status)
      end

      def expense_update_params
        params.permit(:date, :amount, :category, :description, :phase, :receipt_url, :status)
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

        upcoming_meetings = Design::ProjectMeeting.includes(:project).where('starts_at >= ?', Time.current).order(starts_at: :asc).limit(6).map { |meeting| serialize_upcoming_meeting(meeting) }

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

      def ensure_client_contribution(project)
        project.client_contribution || project.create_client_contribution!(client_id: project.client_id, terrain_questionnaire: {}, wishlist: [], plant_journal: [])
      end

      def ensure_harvest_calendar(project)
        project.harvest_calendar || project.create_harvest_calendar!(months: default_months)
      end

      def ensure_maintenance_calendar(project)
        project.maintenance_calendar || project.create_maintenance_calendar!(months: default_months)
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
        {
          id: item.id.to_s,
          projectId: item.project_id.to_s,
          date: item.date.iso8601,
          amount: item.amount.to_f,
          category: item.category,
          description: item.description,
          phase: item.phase,
          memberId: item.member_id,
          memberName: item.member_name,
          receiptUrl: item.receipt_url,
          status: item.status
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
