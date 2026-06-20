# frozen_string_literal: true

module Api
  module V1
    # Campfire (#145, tranche 119a) — salon de chat léger PAR projet.
    # Routes : /api/v1/projects/:type/:id/chat-messages (GET historique paginé,
    # POST création). Le projet est adressé par sa clé de type (lab-project,
    # training, design-project, guild) via Projectable::PROJECT_TYPE_KEYS,
    # comme le reste des ressources projet (mute, task-lists, expenses…).
    #
    # Historique : ordre CHRONOLOGIQUE (ancien → récent), paginé via
    # offset/limit (même convention que NotionRecordsController). Doctrine
    # calme : un message ne notifie pas ; seule une @mention crée une
    # Notification (géré par le modèle ChatMessage via NotificationService).
    #
    # PAS de diffusion temps réel ici (119b) — uniquement la couche REST.
    class ChatMessagesController < BaseController
      DEFAULT_LIMIT = 50
      MAX_LIMIT = 200

      before_action :set_projectable

      def index
        limit = (params[:limit] || DEFAULT_LIMIT).to_i.clamp(1, MAX_LIMIT)
        offset = (params[:offset] || 0).to_i.clamp(0, Float::INFINITY)

        scope = @projectable.chat_messages.ordered.includes(:author)
        total = scope.count

        messages = scope.offset(offset).limit(limit)

        render json: {
          messages: messages.map { |m| serialize_message(m) },
          total: total,
          limit: limit,
          offset: offset,
        }
      end

      def create
        # La présence/non-vacuité du body est validée par le modèle → 422 via
        # le rescue RecordInvalid du BaseController.
        message = @projectable.chat_messages.create!(
          author: current_member,
          body: params[:body]
        )
        render json: { message: serialize_message(message) }, status: :created
      end

      private

      def set_projectable
        @projectable = Projectable::PROJECT_TYPE_KEYS.key(params[:type])&.constantize&.find(params[:id])
        render json: { error: "Type de projet inconnu." }, status: :bad_request unless @projectable
      end

      def serialize_message(message)
        author = message.author
        {
          id: message.id.to_s,
          authorId: message.author_id&.to_s,
          authorName: author ? "#{author.first_name} #{author.last_name}".strip : nil,
          authorAvatar: author&.avatar_url,
          body: message.body,
          createdAt: message.created_at&.iso8601,
          updatedAt: message.updated_at&.iso8601,
        }
      end
    end
  end
end
