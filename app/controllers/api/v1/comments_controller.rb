# frozen_string_literal: true

module Api
  module V1
    # Commentaires polymorphes (#102) sur les objets de travail.
    # Routes imbriquées par parent : /api/v1/tasks/:task_id/comments,
    # /api/v1/events/:event_id/comments. Le modèle Comment n'impose aucune
    # liste fermée — exposer un nouveau parent = une entrée ici + ses routes.
    class CommentsController < BaseController
      PARENTS = {
        "task_id" => Task,
        "event_id" => Event,
      }.freeze

      before_action :set_commentable

      def index
        comments = @commentable.comments.ordered.includes(:author, mentions: :member)
        render json: { comments: comments.map { |c| serialize_comment(c) } }
      end

      def create
        # La présence du body est validée par le modèle → 422 via le rescue
        # RecordInvalid du BaseController (params.require lèverait un
        # ParameterMissing au comportement dépendant de l'environnement).
        comment = @commentable.comments.create!(
          author: current_member,
          body: params[:body]
        )
        render json: { comment: serialize_comment(comment) }, status: :created
      end

      def destroy
        comment = @commentable.comments.find(params[:id])

        unless can_delete?(comment)
          return render json: { error: "Seul l'auteur ou un admin peut supprimer ce commentaire." }, status: :forbidden
        end

        comment.destroy!
        head :no_content
      end

      private

      def set_commentable
        param_key, parent_class = PARENTS.find { |key, _| params[key].present? }
        return render json: { error: "Parent commentable manquant." }, status: :bad_request unless param_key

        @commentable = parent_class.find(params[param_key])
      end

      def can_delete?(comment)
        return false unless current_member

        comment.author_id == current_member.id || current_member.is_admin
      end

      def serialize_comment(comment)
        author = comment.author
        {
          id: comment.id.to_s,
          authorId: comment.author_id&.to_s,
          authorName: author ? "#{author.first_name} #{author.last_name}".strip : nil,
          authorAvatar: author&.avatar_url,
          body: comment.body,
          mentions: comment.mentions.map { |m|
            { id: m.member_id.to_s, name: "#{m.member.first_name} #{m.member.last_name}".strip }
          },
          createdAt: comment.created_at&.iso8601,
          updatedAt: comment.updated_at&.iso8601,
          canDelete: can_delete?(comment),
        }
      end
    end
  end
end
