# frozen_string_literal: true

module Api
  module V1
    class ActivityController < BaseController
      DEFAULT_LIMIT = 30
      MAX_LIMIT = 100
      DELETED_LABEL = "(supprimé)"

      def index
        limit = limit_param
        rows = filtered_events
          .includes(:actor, :subject, :projectable)
          .reorder(created_at: :desc, id: :desc)
          .limit(limit + 1)
          .to_a

        events = rows.first(limit)

        render json: {
          events: events.map { |event| serialize_event(event) },
          hasMore: rows.size > limit,
          nextBefore: rows.size > limit ? events.last&.id : nil
        }
      end

      private

      def filtered_events
        relation = visible_events
        relation = apply_project_filter(relation)
        relation = relation.where(subject_type: params[:subject_type]) if params[:subject_type].present?
        relation = relation.where(actor_id: current_member.id) if params[:scope] == "mine"
        apply_cursor(relation)
      end

      def visible_events
        ActivityEvent.where(
          <<~SQL.squish,
            activity_events.projectable_type IS NULL
            OR EXISTS (
              SELECT 1
              FROM project_memberships
              WHERE project_memberships.member_id = :member_id
                AND project_memberships.projectable_type = activity_events.projectable_type
                AND project_memberships.projectable_id = activity_events.projectable_id
            )
          SQL
          member_id: current_member.id
        )
      end

      def apply_project_filter(relation)
        return relation if params[:project].blank?

        type_key, id = params[:project].to_s.split(":", 2)
        klass_name = Projectable::PROJECT_TYPE_KEYS.key(type_key)

        # Unknown type keys return an empty feed instead of broadening visibility.
        return relation.none if klass_name.blank? || id.blank?

        relation.where(projectable_type: klass_name, projectable_id: id)
      end

      def apply_cursor(relation)
        return relation if params[:before].blank?

        cursor = ActivityEvent.select(:id, :created_at).find_by(id: params[:before])
        return relation.none unless cursor

        relation.where(
          "activity_events.created_at < :created_at OR (activity_events.created_at = :created_at AND activity_events.id < :id)",
          created_at: cursor.created_at,
          id: cursor.id
        )
      end

      def limit_param
        raw = Integer(params[:limit] || DEFAULT_LIMIT)
        [[raw, 1].max, MAX_LIMIT].min
      rescue ArgumentError, TypeError
        DEFAULT_LIMIT
      end

      def serialize_event(event)
        project = safe_association(event, :projectable)

        {
          id: event.id,
          action: event.action,
          createdAt: event.created_at.iso8601,
          actor: serialize_actor(event),
          subject: serialize_subject(event),
          project: serialize_project(project),
          url: project_url(project)
        }
      end

      def serialize_actor(event)
        return nil if event.actor_id.nil?

        actor = safe_association(event, :actor)
        return nil unless actor

        {
          id: actor.id,
          name: [actor.first_name, actor.last_name].compact.join(" ").strip,
          avatar: actor.avatar_url
        }
      end

      def serialize_subject(event)
        subject = safe_association(event, :subject)

        {
          type: event.subject_type,
          id: event.subject_id,
          label: subject_label(subject)
        }
      end

      def serialize_project(project)
        return nil unless project

        {
          typeKey: project.project_type_key,
          id: project.id,
          name: project.project_name
        }
      end

      def project_url(project)
        return "/" unless project

        "/projects/#{project.project_type_key}/#{project.id}"
      end

      def subject_label(subject)
        case subject
        when nil
          DELETED_LABEL
        when Task
          subject.name.presence || DELETED_LABEL
        when Event
          subject.title.presence || DELETED_LABEL
        when ::Strategy::Deliberation
          subject.title.presence || DELETED_LABEL
        when Comment
          %(Commentaire sur "#{subject_label(safe_association(subject, :commentable))}")
        else
          if subject.respond_to?(:title)
            subject.title.presence || DELETED_LABEL
          elsif subject.respond_to?(:name)
            subject.name.presence || DELETED_LABEL
          else
            DELETED_LABEL
          end
        end
      end

      def safe_association(record, name)
        record.public_send(name)
      rescue ActiveRecord::RecordNotFound
        nil
      end
    end
  end
end
