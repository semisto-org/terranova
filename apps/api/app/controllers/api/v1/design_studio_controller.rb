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

        render json: {
          project: serialize_project(project),
          teamMembers: project.team_members.order(:assigned_at).map { |item| serialize_team_member(item) },
          timesheets: project.timesheets.order(date: :desc).map { |item| serialize_timesheet(item) },
          expenses: project.expenses.order(date: :desc).map { |item| serialize_expense(item) },
          siteAnalysis: serialize_site_analysis(project.site_analysis),
          plantPalette: serialize_project_palette(palette),
          meetings: project.meetings.order(starts_at: :asc).map { |meeting| serialize_meeting(meeting) },
          placeholderTabs: %w[overview team timesheets expenses site-analysis plans palette planting-plan quotes documents album meetings co-gestion]
        }
      end

      def create
        template = params[:template_id].present? ? Design::ProjectTemplate.find(params[:template_id]) : nil
        project = Design::Project.new(project_params)

        apply_template_defaults(project, template) if template
        project.phase = 'offre' if project.phase.blank?

        if project.project_manager_id.blank?
          project.project_manager_id = Member.order(:id).pick(:id)&.to_s || 'unassigned'
        end

        project.status = 'pending' if project.status.blank?
        project.client_id = "client-#{SecureRandom.hex(4)}" if project.client_id.blank?

        project.save!
        ensure_palette(project)

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
        billed_hours = item.mode == 'billed' ? item.hours.to_f : 0
        semos_hours = item.mode == 'semos' ? item.hours.to_f : 0
        project.increment!(:hours_billed, billed_hours)
        project.increment!(:hours_semos, semos_hours)

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

      private

      def find_project
        Design::Project.find(params.require(:project_id))
      end

      def project_params
        params.permit(
          :name,
          :client_id,
          :client_name,
          :client_email,
          :client_phone,
          :place_id,
          :address,
          :latitude,
          :longitude,
          :area,
          :phase,
          :status,
          :start_date,
          :planting_date,
          :project_manager_id,
          :hours_planned,
          :hours_worked,
          :hours_billed,
          :hours_semos,
          :expenses_budget,
          :expenses_actual
        )
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
        params.permit(
          climate: {},
          geomorphology: {},
          water: {},
          socio_economic: {},
          access_data: {},
          vegetation: {},
          microclimate: {},
          buildings: {},
          soil: {},
          client_observations: {},
          client_photos: [],
          client_usage_map: []
        )
      end

      def palette_item_params
        params.permit(
          :species_id,
          :species_name,
          :common_name,
          :variety_id,
          :variety_name,
          :layer,
          :quantity,
          :unit_price,
          :notes,
          harvest_months: [],
          harvest_products: []
        )
      end

      def palette_item_update_params
        params.permit(:layer, :quantity, :unit_price, :notes)
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

        monthly_hours = projects.sum do |project|
          project.updated_at >= beginning_of_month ? project.hours_worked : 0
        end

        yearly_revenue = projects.sum do |project|
          project.updated_at >= beginning_of_year ? project.expenses_actual.to_f : 0
        end

        conversion_rate = if projects.empty?
          0.0
        else
          completed = projects.count { |project| project.status == 'completed' }
          completed.to_f / projects.size
        end

        upcoming_meetings = Design::ProjectMeeting
          .includes(:project)
          .where('starts_at >= ?', Time.current)
          .order(starts_at: :asc)
          .limit(6)
          .map { |meeting| serialize_upcoming_meeting(meeting) }

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
          coordinates: {
            lat: project.latitude.to_f,
            lng: project.longitude.to_f
          },
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
          startsAt: meeting.starts_at.iso8601,
          durationMinutes: meeting.duration_minutes,
          location: meeting.location
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
