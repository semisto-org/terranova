# frozen_string_literal: true

module Api
  module V1
    class ProjectsController < BaseController
      before_action :set_projectable, only: [
        :show, :update, :destroy,
        :list_expenses, :create_expense,
        :list_revenues, :create_revenue,
        :list_timesheets, :create_timesheet,
        :list_events, :create_event,
        :list_knowledge_sections, :create_knowledge_section
      ]

      CREATABLE_TYPES = %w[lab-project].freeze
      # Per-type permitted params. Frontend sends `name`; for Academy::Training we
      # remap to `title` since that's the actual column.
      COMMON_UPDATE_FIELDS = {
        "lab-project"    => %i[name description pole status needs_reclassification],
        "design-project" => %i[name status],
        "training"       => %i[name description status],
        "guild"          => %i[name description]
      }.freeze

      # GET /api/v1/projects
      def index
        projects = []

        PoleProject.includes(:project_memberships, :unified_task_lists).find_each do |p|
          projects << serialize_project_summary(p)
        end

        Design::Project.where(deleted_at: nil).includes(:project_memberships, :unified_task_lists).find_each do |p|
          projects << serialize_project_summary(p)
        end

        Academy::Training.where(deleted_at: nil).includes(:project_memberships, :unified_task_lists).find_each do |p|
          projects << serialize_project_summary(p)
        end

        Guild.includes(:project_memberships, :unified_task_lists).find_each do |p|
          projects << serialize_project_summary(p)
        end

        render json: { items: projects.sort_by { |p| p[:name].downcase } }
      end

      # GET /api/v1/projects/:type/:id
      def show
        render json: serialize_project_detail(@projectable)
      end

      # POST /api/v1/projects/:type
      def create
        type_key = params[:type]
        unless CREATABLE_TYPES.include?(type_key)
          return render json: { error: "Creation via unified endpoint not supported for type: #{type_key}" }, status: :unprocessable_entity
        end

        klass_name = Projectable::PROJECT_TYPE_KEYS.key(type_key)
        project = klass_name.constantize.new(common_update_params(type_key))

        if project.save
          render json: serialize_project_summary(project), status: :created
        else
          render json: { error: project.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/projects/:type/:id
      def update
        attrs = common_update_params(params[:type])

        if @projectable.update(attrs)
          render json: serialize_project_detail(@projectable)
        else
          render json: { error: @projectable.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/projects/:type/:id
      def destroy
        if @projectable.respond_to?(:soft_delete!)
          @projectable.soft_delete!
        else
          @projectable.destroy!
        end
        head :no_content
      end

      # ── Expenses ──

      # GET /api/v1/projects/:type/:id/expenses
      def list_expenses
        expenses = @projectable.expenses.where(deleted_at: nil).order(invoice_date: :desc)
        render json: { items: expenses.map { |e| serialize_expense(e) } }
      end

      # POST /api/v1/projects/:type/:id/expenses
      def create_expense
        expense = @projectable.expenses.build(expense_params)
        if expense.save
          render json: serialize_expense(expense), status: :created
        else
          render json: { errors: expense.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/projects/expenses/:id
      def update_expense
        expense = Expense.find(params[:id])
        if expense.update(expense_params)
          render json: serialize_expense(expense)
        else
          render json: { errors: expense.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/projects/expenses/:id
      def destroy_expense
        expense = Expense.find(params[:id])
        expense.soft_delete!
        head :no_content
      end

      # ── Revenues ──

      # GET /api/v1/projects/:type/:id/revenues
      def list_revenues
        revenues = @projectable.revenues.where(deleted_at: nil).order(date: :desc)
        render json: { items: revenues.map { |r| serialize_revenue(r) } }
      end

      # POST /api/v1/projects/:type/:id/revenues
      def create_revenue
        revenue = @projectable.revenues.build(revenue_params)
        if revenue.save
          render json: serialize_revenue(revenue), status: :created
        else
          render json: { errors: revenue.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/projects/revenues/:id
      def update_revenue
        revenue = Revenue.find(params[:id])
        if revenue.update(revenue_params)
          render json: serialize_revenue(revenue)
        else
          render json: { errors: revenue.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/projects/revenues/:id
      def destroy_revenue
        revenue = Revenue.find(params[:id])
        revenue.soft_delete!
        head :no_content
      end

      # ── Timesheets ──

      # GET /api/v1/projects/:type/:id/timesheets
      def list_timesheets
        timesheets = @projectable.timesheets.order(date: :desc)
        render json: { items: timesheets.map { |t| serialize_timesheet(t) } }
      end

      # POST /api/v1/projects/:type/:id/timesheets
      def create_timesheet
        ts = @projectable.timesheets.build(timesheet_params)
        if ts.save
          render json: serialize_timesheet(ts), status: :created
        else
          render json: { errors: ts.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/projects/timesheets/:id
      def update_timesheet
        ts = Timesheet.find(params[:id])
        if ts.update(timesheet_params)
          render json: serialize_timesheet(ts)
        else
          render json: { errors: ts.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/projects/timesheets/:id
      def destroy_timesheet
        ts = Timesheet.find(params[:id])
        ts.destroy!
        head :no_content
      end

      # ── Events ──

      # GET /api/v1/projects/:type/:id/events
      def list_events
        events = @projectable.events.where(deleted_at: nil)
                   .includes(:event_type, :event_attendees)
                   .order(start_date: :desc)
        render json: { items: events.map { |e| serialize_event(e) } }
      end

      # POST /api/v1/projects/:type/:id/events
      def create_event
        event = @projectable.events.build(event_params)
        if event.save
          render json: serialize_event(event), status: :created
        else
          render json: { errors: event.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/projects/events/:id
      def update_event
        event = Event.find(params[:id])
        if event.update(event_params)
          render json: serialize_event(event)
        else
          render json: { errors: event.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/projects/events/:id
      def destroy_event
        event = Event.find(params[:id])
        event.soft_delete!
        head :no_content
      end

      # ── Knowledge Sections ──

      # GET /api/v1/projects/:type/:id/knowledge-sections
      def list_knowledge_sections
        sections = @projectable.knowledge_sections.ordered
        render json: { items: sections.map(&:as_json_brief) }
      end

      # POST /api/v1/projects/:type/:id/knowledge-sections
      def create_knowledge_section
        section = @projectable.knowledge_sections.build(knowledge_section_params)
        section.created_by_id = current_member&.id
        if section.save
          render json: { section: section.as_json_brief }, status: :created
        else
          render json: { errors: section.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_projectable
        type_key = params[:type]
        klass_name = Projectable::PROJECT_TYPE_KEYS.key(type_key)
        raise ActiveRecord::RecordNotFound, "Unknown project type: #{type_key}" unless klass_name

        @projectable = klass_name.constantize.find(params[:id])
      end

      # ── Params ──

      def expense_params
        params.permit(
          :name, :notes, :supplier, :supplier_contact_id, :status, :expense_type,
          :invoice_date, :payment_date, :payment_type, :billing_zone, :vat_rate,
          :eu_vat_rate, :eu_vat_amount, :amount_excl_vat, :vat_6, :vat_12, :vat_21,
          :total_incl_vat, :category, :billable_to_client, :rebilling_status,
          :paid_by, :reimbursed, :reimbursement_date, :document,
          poles: []
        )
      end

      def revenue_params
        params.permit(
          :amount, :amount_excl_vat, :description, :date, :contact_id, :pole,
          :revenue_type, :status, :label, :notes, :vat_rate, :vat_6, :vat_21,
          :vat_exemption, :payment_method, :invoice_url, :paid_at, :category
        )
      end

      def timesheet_params
        params.permit(
          :member_id, :member_name, :date, :hours, :description, :phase,
          :mode, :billed, :travel_km, :event_id, :service_type_id
        )
      end

      def event_params
        params.permit(
          :title, :start_date, :end_date, :all_day, :location,
          :description, :event_type_id, :cycle_id
        )
      end

      def knowledge_section_params
        params.permit(:name, :description, :position)
      end

      def common_update_params(type_key)
        fields = COMMON_UPDATE_FIELDS[type_key] || []
        permitted = params.permit(*fields)

        # Academy::Training uses `title` column; frontend sends `name`.
        if type_key == "training" && permitted.key?(:name)
          permitted[:title] = permitted.delete(:name)
        end

        permitted
      end

      # ── Serializers ──

      def serialize_project_summary(project)
        tasks = project.unified_task_lists.flat_map(&:tasks)
        total = tasks.size
        completed = tasks.count { |t| t.status == "completed" }

        {
          id: project.id.to_s,
          name: project.project_name,
          typeKey: project.project_type_key,
          status: project.respond_to?(:status) ? project.status : nil,
          description: project.respond_to?(:description) ? project.description.to_s : "",
          teamCount: project.project_memberships.size,
          totalTasks: total,
          completedTasks: completed,
          createdAt: project.created_at.iso8601,
          updatedAt: project.updated_at.iso8601
        }
      end

      def serialize_project_detail(project)
        summary = serialize_project_summary(project)

        members = project.project_memberships.includes(:member).map do |pm|
          {
            id: pm.id.to_s,
            memberId: pm.member_id.to_s,
            firstName: pm.member.first_name,
            lastName: pm.member.last_name,
            avatar: pm.member.avatar_url,
            role: pm.role,
            isPaid: pm.is_paid,
            joinedAt: pm.joined_at&.iso8601
          }
        end

        task_lists = project.unified_task_lists.includes(tasks: :assignee).order(:position, :created_at).map do |tl|
          {
            id: tl.id.to_s,
            name: tl.name,
            position: tl.position,
            tasks: tl.tasks.order(:position, :created_at).map { |t| serialize_task_for_project(t) }
          }
        end

        summary.merge(
          members: members,
          taskLists: task_lists,
          expensesCount: project.expenses.where(deleted_at: nil).count,
          revenuesCount: project.revenues.where(deleted_at: nil).count,
          timesheetsCount: project.timesheets.count,
          eventsCount: project.events.where(deleted_at: nil).count,
          knowledgeSectionsCount: project.knowledge_sections.count,
          typeSpecific: serialize_type_specific(project)
        )
      end

      def serialize_task_for_project(task)
        {
          id: task.id.to_s,
          name: task.name,
          description: task.description,
          status: task.status,
          dueDate: task.due_date&.iso8601,
          assigneeId: task.assignee_id&.to_s,
          assigneeName: task.assignee_name,
          assigneeAvatar: task.assignee&.avatar_url,
          priority: task.priority,
          tags: task.tags,
          timeMinutes: task.time_minutes,
          position: task.position,
          parentId: task.parent_id&.to_s,
          taskListId: task.task_list_id.to_s,
          createdAt: task.created_at.iso8601,
          updatedAt: task.updated_at.iso8601
        }
      end

      def serialize_type_specific(project)
        case project
        when Design::Project
          {
            phase: project.phase,
            projectType: project.project_type,
            clientName: project.client_name,
            clientEmail: project.client_email,
            city: project.city,
            area: project.area,
            expensesBudget: project.expenses_budget.to_f,
            expensesActual: project.expenses_actual.to_f,
            hoursPlanned: project.hours_planned,
            hoursWorked: project.hours_worked
          }
        when Academy::Training
          {
            trainingTypeId: project.training_type_id.to_s,
            trainingTypeName: project.training_type&.name,
            registrationMode: project.registration_mode,
            price: project.price.to_f,
            maxParticipants: project.max_participants,
            totalCapacity: project.total_capacity,
            totalSpotsTaken: project.total_spots_taken,
            sessionsCount: project.sessions.where(deleted_at: nil).count,
            registrationsCount: project.registrations.where(deleted_at: nil).count
          }
        when Guild
          {
            guildType: project.guild_type,
            color: project.color,
            icon: project.icon,
            leaderId: project.leader_id&.to_s,
            leaderName: project.leader&.then { |m| "#{m.first_name} #{m.last_name}" },
            credentialsCount: project.credentials.count
          }
        when PoleProject
          {
            pole: project.pole,
            actionsCount: project.actions.count,
            notesCount: project.notes.count
          }
        else
          {}
        end
      end

      def serialize_expense(item)
        doc_url = item.document.attached? ? Rails.application.routes.url_helpers.rails_blob_url(item.document, only_path: true) : nil
        {
          id: item.id.to_s,
          name: item.name,
          supplier: item.supplier_display_name,
          supplierContactId: item.supplier_contact_id&.to_s,
          status: item.status,
          expenseType: item.expense_type,
          invoiceDate: item.invoice_date&.iso8601,
          category: item.category,
          billingZone: item.billing_zone,
          vatRate: item.vat_rate,
          amountExclVat: item.amount_excl_vat.to_f,
          vat6: item.vat_6.to_f,
          vat12: item.vat_12.to_f,
          vat21: item.vat_21.to_f,
          totalInclVat: item.total_incl_vat.to_f,
          poles: item.poles,
          paymentType: item.payment_type,
          paymentDate: item.payment_date&.iso8601,
          billableToClient: item.billable_to_client,
          rebillingStatus: item.rebilling_status,
          notes: item.notes,
          documentUrl: doc_url,
          projectableType: item.projectable_type,
          projectableId: item.projectable_id&.to_s,
          projectName: item.projectable&.project_name,
          createdAt: item.created_at.iso8601
        }
      end

      def serialize_revenue(r)
        {
          id: r.id.to_s,
          amount: r.amount.to_f,
          amountExclVat: r.amount_excl_vat.to_f,
          description: r.description,
          date: r.date&.iso8601,
          contactId: r.contact_id&.to_s,
          contactName: r.contact&.name,
          pole: r.pole,
          revenueType: r.revenue_type,
          status: r.status,
          label: r.label,
          notes: r.notes,
          vat6: r.vat_6.to_f,
          vat21: r.vat_21.to_f,
          paymentMethod: r.payment_method,
          paidAt: r.paid_at&.iso8601,
          projectableType: r.projectable_type,
          projectableId: r.projectable_id&.to_s,
          projectName: r.projectable&.project_name,
          createdAt: r.created_at.iso8601
        }
      end

      def serialize_timesheet(ts)
        {
          id: ts.id.to_s,
          memberId: ts.member_id.to_s,
          memberName: ts.member_name,
          date: ts.date.iso8601,
          hours: ts.hours.to_f,
          description: ts.description,
          phase: ts.phase,
          mode: ts.mode,
          billed: ts.billed,
          travelKm: ts.travel_km,
          eventId: ts.event_id&.to_s,
          serviceTypeId: ts.service_type_id&.to_s,
          projectableType: ts.projectable_type,
          projectableId: ts.projectable_id&.to_s,
          projectName: ts.projectable&.project_name,
          createdAt: ts.created_at.iso8601
        }
      end

      def serialize_event(event)
        {
          id: event.id.to_s,
          title: event.title,
          startDate: event.start_date.iso8601,
          endDate: event.end_date.iso8601,
          allDay: event.all_day,
          location: event.location,
          description: event.description,
          eventTypeId: event.event_type_id.to_s,
          eventTypeLabel: event.event_type&.label,
          attendeeIds: event.event_attendees.map { |ea| ea.member_id.to_s },
          projectableType: event.projectable_type,
          projectableId: event.projectable_id&.to_s,
          createdAt: event.created_at.iso8601
        }
      end
    end
  end
end
