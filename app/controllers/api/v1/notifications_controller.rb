# frozen_string_literal: true

module Api
  module V1
    # Boîte « Hey! » (#105) — lecture des Notification générées par #104.
    #
    # Doctrine directed-at-me : ce contrôleur ne sert QUE les notifications
    # dont le membre courant est destinataire (elles sont par-destinataire
    # par construction). Le flux ambiant, lui, vit dans Activity (#110),
    # sans compteur — ne jamais mélanger les deux surfaces.
    class NotificationsController < BaseController
      DEFAULT_LIMIT = 50

      def index
        notifications = scope
          .includes(:actor, :notifiable, activity_event: :projectable)
          .order(Arel.sql("read_at IS NULL DESC"), created_at: :desc)
          .limit(params.fetch(:limit, DEFAULT_LIMIT).to_i.clamp(1, 200))

        render json: {
          notifications: notifications.map { |n| serialize_notification(n) },
          unreadCount: scope.unread.count,
        }
      end

      def unread_count
        render json: { count: scope.unread.count }
      end

      def mark_read
        notification = scope.find(params[:id])
        notification.mark_read!
        render json: { id: notification.id.to_s, readAt: notification.read_at.iso8601 }
      end

      def mark_all_read
        count = scope.unread.update_all(read_at: Time.current)
        render json: { count: count }
      end

      private

      # Tout passe par ce scope : impossible de lire ou marquer la
      # notification d'un autre membre (404 sinon).
      def scope
        Notification.where(recipient_id: current_member.id)
      end

      def serialize_notification(notification)
        subject = notification.notifiable
        project = notification.activity_event&.projectable

        {
          id: notification.id.to_s,
          kind: notification.kind,
          readAt: notification.read_at&.iso8601,
          createdAt: notification.created_at.iso8601,
          actor: serialize_actor(notification.actor),
          subject: serialize_subject(subject),
          project: serialize_project(project),
          url: project ? "/projects/#{project.project_type_key}/#{project.id}" : "/",
        }
      end

      def serialize_actor(actor)
        return nil if actor.nil?

        { id: actor.id.to_s, name: "#{actor.first_name} #{actor.last_name}".strip, avatar: actor.avatar_url }
      end

      def serialize_subject(subject)
        return { type: nil, id: nil, label: "(supprimé)" } if subject.nil?

        { type: subject.class.name, id: subject.id.to_s, label: subject_label(subject) }
      end

      def subject_label(subject)
        case subject
        when Comment
          parent = subject.commentable
          parent_label = parent.respond_to?(:name) ? parent.name : parent.try(:title)
          parent_label || "un commentaire"
        else
          subject.try(:name) || subject.try(:title) || subject.class.name
        end
      end

      def serialize_project(project)
        return nil if project.nil?

        { typeKey: project.project_type_key, id: project.id.to_s, name: project.project_name }
      end
    end
  end
end
