# frozen_string_literal: true

module Api
  module V1
    class TasksController < BaseController
      before_action :set_projectable, only: [:list_task_lists, :create_task_list]
      before_action :set_task_list, only: [:update_task_list, :destroy_task_list, :reorder_task_list, :create_task, :reorder_tasks]
      before_action :set_task, only: [:update_task, :toggle_task, :destroy_task, :star_task, :ping_task]

      # GET /api/v1/projects/:type/:id/task-lists
      def list_task_lists
        task_lists = @projectable.unified_task_lists
          .includes(tasks: :assignee)
          .order(:position, :created_at)

        render json: { items: task_lists.map { |tl| serialize_task_list(tl) } }
      end

      # POST /api/v1/projects/:type/:id/task-lists
      def create_task_list
        task_list = @projectable.unified_task_lists.build(task_list_params)
        task_list.position ||= @projectable.unified_task_lists.maximum(:position).to_i + 1

        if task_list.save
          render json: serialize_task_list(task_list), status: :created
        else
          render json: { error: task_list.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/task-lists/:id
      def update_task_list
        if @task_list.update(task_list_params)
          render json: serialize_task_list(@task_list)
        else
          render json: { error: @task_list.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/task-lists/:id
      def destroy_task_list
        @task_list.destroy!
        head :no_content
      end

      # PATCH /api/v1/task-lists/:id/reorder
      def reorder_task_list
        ids = params[:task_ids] || []
        ids.each_with_index do |id, index|
          @task_list.tasks.where(id: id).update_all(position: index)
        end
        head :no_content
      end

      # POST /api/v1/task-lists/:task_list_id/tasks
      def create_task
        task = @task_list.tasks.build(task_params)
        task.position ||= @task_list.tasks.maximum(:position).to_i + 1
        resolve_assignee(task)

        if task.save
          render json: serialize_task(task), status: :created
        else
          render json: { error: task.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/tasks/:id
      def update_task
        @task.assign_attributes(task_params)
        resolve_assignee(@task)
        # Complétion via le formulaire (pas seulement via toggle) : on trace l'auteur.
        if @task.status_changed? && @task.status == "completed" && @task.completed_by_id.blank?
          @task.completed_by = current_member
        end

        if @task.save
          render json: serialize_task(@task)
        else
          render json: { error: @task.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/tasks/:id/toggle
      def toggle_task
        if @task.status == "completed"
          @task.status = "pending"
        else
          @task.status = "completed"
          @task.completed_by = current_member
        end
        @task.save!
        render json: serialize_task(@task)
      end

      # PATCH /api/v1/tasks/:id/star — bascule « ma sélection »
      def star_task
        @task.update!(starred_at: @task.starred_at.present? ? nil : Time.current)
        render json: serialize_task(@task)
      end

      # PATCH /api/v1/tasks/:id/ping — coucou bienveillant (in-app)
      def ping_task
        if @task.pinged_at.present?
          @task.update!(pinged_at: nil, pinged_by: nil)
        else
          @task.update!(pinged_at: Time.current, pinged_by: current_member)
        end
        render json: serialize_task(@task)
      end

      # DELETE /api/v1/tasks/:id
      def destroy_task
        @task.destroy!
        head :no_content
      end

      # PATCH /api/v1/task-lists/:task_list_id/tasks/reorder
      def reorder_tasks
        ids = params[:task_ids] || []
        ids.each_with_index do |id, index|
          @task_list.tasks.where(id: id).update_all(position: index)
        end
        head :no_content
      end

      # GET /api/v1/my-tasks
      #
      # Renvoie les tâches non terminées + les tâches terminées récemment (≤ 14 j),
      # pour que cocher une tâche ne la fasse pas disparaître du drawer : elle
      # reste visible (grisée/barrée) et alimente le fil daté « récemment terminé ».
      def my_tasks
        render json: { projects: task_groups_for(current_member.id) }
      end

      # GET /api/v1/member-tasks/:member_id
      #
      # Mêmes données que my-tasks mais pour un autre membre : permet de consulter
      # la liste d'un collègue et d'y faire « coucou » sur une tâche qu'on juge
      # importante (la tâche remonte alors dans SA liste).
      def member_tasks
        member = Member.find(params[:member_id])
        render json: {
          member: { id: member.id.to_s, firstName: member.first_name, lastName: member.last_name, avatar: member.avatar_url },
          projects: task_groups_for(member.id)
        }
      end

      # GET /api/v1/tasks/meeting-options
      #
      # Réunions proposées dans le sélecteur « Amener en réunion » (#37) :
      # les événements à venir (non terminés) auxquels le membre courant est
      # convié. Triés par date de début (le plus proche d'abord).
      def meeting_options
        events = Event.joins(:event_attendees)
          .where(event_attendees: { member_id: current_member.id })
          .where("events.end_date >= ?", Time.current)
          .order(start_date: :asc)
          .includes(:event_type)

        render json: {
          items: events.map do |event|
            {
              id: event.id.to_s,
              title: event.title,
              type: event.event_type.label,
              startDate: event.start_date.iso8601,
              location: event.location
            }
          end
        }
      end

      # GET /api/v1/my-planning
      #
      # « Mon planning » (#142) : agrège, cross-projets, les events où je suis
      # attendu (event_attendees) et mes tâches assignées (assignee_id) ayant
      # une due_date, sous une forme commune consommable par CalendarView.
      #
      # Paramètres :
      #   mode      — "mine" (défaut) | "everyone"
      #   project   — "type:id" pour ne garder qu'un projet (ex. "lab-project:3")
      #   types     — liste séparée par des virgules parmi {events, todos}
      #               (défaut : les deux)
      #
      # Réponse : { entries: [...], projects: [{type,id,name}] }
      # où `projects` peuple le filtre projet (les projets où je suis membre).
      def my_planning
        mode = params[:mode] == "everyone" ? "everyone" : "mine"
        wanted_types = planning_types
        project_filter = parse_project_filter(params[:project])
        member_projects = projects_for_member(current_member)

        entries = []
        if wanted_types.include?("events")
          entries.concat(planning_events(mode, project_filter, member_projects))
        end
        if wanted_types.include?("todos")
          entries.concat(planning_todos(mode, project_filter, member_projects))
        end

        render json: {
          entries: entries,
          projects: member_projects.map do |projectable|
            {
              type: projectable.project_type_key,
              id: projectable.id.to_s,
              name: projectable.project_name
            }
          end
        }
      end

      private

      # Types d'entrées demandés, normalisés (events / todos). Défaut : les deux.
      def planning_types
        raw = params[:types].to_s.split(",").map(&:strip).reject(&:blank?)
        return %w[events todos] if raw.empty?

        raw & %w[events todos]
      end

      # Décompose le filtre projet "type:id" en { type:, projectable_type:, id: }.
      # Renvoie nil si absent ou inconnu.
      def parse_project_filter(raw)
        return nil if raw.blank?

        type_key, id = raw.to_s.split(":", 2)
        klass_name = Projectable::PROJECT_TYPE_KEYS.key(type_key)
        return nil unless klass_name && id.present?

        { projectable_type: klass_name, projectable_id: id }
      end

      # Projets où le membre est inscrit (les 4 types Projectable). Dédupliqués.
      def projects_for_member(member)
        ProjectMembership
          .where(member_id: member.id)
          .includes(:projectable)
          .map(&:projectable)
          .compact
          .uniq { |p| [p.class.name, p.id] }
      end

      # Events sérialisés au shape calendrier (+ source:'event').
      # mine     → uniquement les events où je suis attendu.
      # everyone → les events des projets où je suis membre (sans filtre projet),
      #            ou du projet ciblé si un filtre projet est passé.
      def planning_events(mode, project_filter, member_projects)
        scope = Event.includes(:event_attendees, :event_type)

        if mode == "mine"
          scope = scope
            .joins(:event_attendees)
            .where(event_attendees: { member_id: current_member.id })
        end

        if project_filter
          scope = scope.where(
            projectable_type: project_filter[:projectable_type],
            projectable_id: project_filter[:projectable_id]
          )
        elsif mode == "everyone"
          # everyone sans filtre projet : restreindre aux projets du membre.
          pairs = member_projects.map { |p| [p.class.name, p.id] }
          return [] if pairs.empty?

          conditions = pairs.map { "(events.projectable_type = ? AND events.projectable_id = ?)" }.join(" OR ")
          scope = scope.where(conditions, *pairs.flatten)
        end

        scope.distinct.map { |event| serialize_planning_event(event) }
      end

      # Tâches assignées + datées, sérialisées en entrées calendrier allDay
      # mono-jour sur due_date (+ source:'todo'). Les tâches legacy sans
      # assignee_id sont exclues (where.not). En mode everyone (sans filtre
      # projet), on restreint aux projets où le membre est inscrit.
      def planning_todos(mode, project_filter, member_projects)
        scope = Task
          .includes(:assignee, task_list: :taskable)
          .where.not(assignee_id: nil)
          .where.not(due_date: nil)

        if mode == "mine"
          scope = scope.where(assignee_id: current_member.id)
        end

        tasks = scope.to_a

        # Filtrage par projet (en mémoire : le projet est porté par
        # task_list.taskable, polymorphe, pas directement sur tasks).
        if project_filter
          tasks.select! do |task|
            projectable = task.task_list&.taskable
            projectable &&
              projectable.class.name == project_filter[:projectable_type] &&
              projectable.id.to_s == project_filter[:projectable_id].to_s
          end
        elsif mode == "everyone"
          # everyone sans filtre : restreindre aux projets du membre.
          allowed = member_projects.map { |p| [p.class.name, p.id] }.to_set
          tasks.select! do |task|
            projectable = task.task_list&.taskable
            projectable && allowed.include?([projectable.class.name, projectable.id])
          end
        end

        tasks.filter_map { |task| serialize_planning_todo(task) }
      end

      # Event → entrée calendrier (même shape que lab_management#serialize_event).
      def serialize_planning_event(event)
        {
          id: event.id.to_s,
          title: event.title,
          type: event.event_type.label,
          startDate: event.start_date.iso8601,
          endDate: event.end_date.iso8601,
          allDay: event.all_day,
          location: event.location,
          description: event.description,
          attendeeIds: event.event_attendees.map { |ea| ea.member_id.to_s },
          cycleId: event.cycle_id&.to_s,
          source: "event"
        }
      end

      # Task datée → entrée calendrier allDay mono-jour sur due_date.
      def serialize_planning_todo(task)
        projectable = task.task_list&.taskable
        date = task.due_date.to_time.iso8601

        {
          id: "todo-#{task.id}",
          taskId: task.id.to_s,
          title: task.name,
          type: "À faire",
          startDate: date,
          endDate: date,
          allDay: true,
          location: "",
          description: task.description,
          attendeeIds: task.assignee_id ? [task.assignee_id.to_s] : [],
          cycleId: nil,
          source: "todo",
          assigneeId: task.assignee_id&.to_s,
          projectName: projectable&.project_name,
          projectType: projectable&.project_type_key,
          projectId: projectable&.id&.to_s
        }
      end

      def task_groups_for(member_id, recent_days: 14)
        tasks = Task.includes(:assignee, task_list: :taskable, assigned_by: {}, completed_by: {}, pinged_by: {})
          .where(assignee_id: member_id)
          .where("tasks.status != 'completed' OR tasks.completed_at >= ?", recent_days.days.ago)
          .order(Arel.sql("due_date ASC NULLS LAST"), created_at: :desc)

        tasks.group_by { |t| t.task_list.taskable }.map do |projectable, project_tasks|
          next unless projectable

          {
            projectType: projectable.project_type_key,
            projectId: projectable.id.to_s,
            projectName: projectable.project_name,
            tasks: project_tasks.map { |t| serialize_task(t) }
          }
        end.compact
      end

      def set_projectable
        type_key = params[:type]
        klass_name = Projectable::PROJECT_TYPE_KEYS.key(type_key)
        raise ActiveRecord::RecordNotFound, "Unknown project type: #{type_key}" unless klass_name

        @projectable = klass_name.constantize.find(params[:id])
      end

      def set_task_list
        @task_list = TaskList.find(params[:task_list_id] || params[:id])
      end

      def set_task
        @task = Task.find(params[:id])
      end

      def task_list_params
        params.permit(:name, :position)
      end

      def task_params
        # assignee_name n'est PLUS accepté en entrée : il est dérivé du membre
        # assigné via resolve_assignee. On n'autorise donc que l'assignation par
        # assignee_id (un membre de l'équipe), jamais du texte libre.
        permitted = params.permit(:name, :description, :notes, :status, :due_date, :assignee_id,
                                   :priority, :time_minutes, :position, :parent_id, :event_id, tags: [])
        %i[priority due_date assignee_id time_minutes parent_id event_id].each do |key|
          permitted[key] = nil if permitted[key].is_a?(String) && permitted[key].empty?
        end
        permitted
      end

      def resolve_assignee(task)
        if task.assignee_id.present?
          member = Member.find_by(id: task.assignee_id)
          task.assignee_name = "#{member.first_name} #{member.last_name}".strip if member
          # Trace qui a posé l'assignation (le membre courant) quand elle change.
          task.assigned_by = current_member if task.assignee_id_changed?
        elsif task.assignee_id_changed? || task.new_record?
          # Désassignation explicite : on efface le nom dérivé.
          task.assignee_name = nil
        end
      end

      def serialize_member(member)
        return nil unless member

        {
          id: member.id.to_s,
          firstName: member.first_name,
          lastName: member.last_name,
          avatar: member.avatar_url
        }
      end

      def serialize_task_list(task_list)
        {
          id: task_list.id.to_s,
          name: task_list.name,
          position: task_list.position,
          tasks: task_list.tasks.order(:position, :created_at).map { |t| serialize_task(t) }
        }
      end

      def serialize_task(task)
        projectable = task.task_list&.taskable
        {
          id: task.id.to_s,
          name: task.name,
          description: task.description,
          notes: task.notes,
          status: task.status,
          dueDate: task.due_date&.iso8601,
          assigneeId: task.assignee_id&.to_s,
          assigneeName: task.assignee_name,
          assigneeAvatar: task.assignee&.avatar_url,
          assignedAt: task.assigned_at&.iso8601,
          assignedBy: serialize_member(task.assigned_by),
          completedAt: task.completed_at&.iso8601,
          completedBy: serialize_member(task.completed_by),
          starredAt: task.starred_at&.iso8601,
          pingedAt: task.pinged_at&.iso8601,
          pingedBy: serialize_member(task.pinged_by),
          priority: task.priority,
          tags: task.tags,
          timeMinutes: task.time_minutes,
          position: task.position,
          parentId: task.parent_id&.to_s,
          eventId: task.event_id&.to_s,
          eventTitle: task.event&.title,
          taskListId: task.task_list_id.to_s,
          projectType: projectable&.project_type_key,
          projectId: projectable&.id&.to_s,
          projectName: projectable&.project_name,
          createdAt: task.created_at.iso8601,
          updatedAt: task.updated_at.iso8601
        }
      end
    end
  end
end
