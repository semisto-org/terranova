module Api
  module V1
    # Pipeline « de la réunion aux tâches » (#47) — substrat API.
    # Saisie d'un compte-rendu (liste de points proposés), gate de validation
    # (un point validé devient une tâche assignée rattachée à la réunion et au
    # projet), et vue des points en attente de validation. UI suivie en #47b.
    class EventActionItemsController < BaseController
      rescue_from Meetings::ActionItemValidator::Error do |error|
        render json: { error: error.message }, status: :unprocessable_entity
      end

      # POST events/:event_id/action-items — saisir/coller un compte-rendu.
      def create
        event = Event.find(params[:event_id])
        descriptions = Array(params[:items]).map { |raw| extract_description(raw) }.reject(&:blank?)

        items = descriptions.each_with_index.map do |description, index|
          event.action_items.create!(
            description: description, status: "proposed",
            created_by: current_member, position: index
          )
        end

        render json: { items: items.map { |item| serialize(item) } }, status: :created
      end

      # GET events/:event_id/action-items — points d'un compte-rendu.
      def index
        event = Event.find(params[:event_id])
        render json: { items: event.action_items.ordered.map { |item| serialize(item) } }
      end

      # PATCH event-action-items/:id/validate — gate du coordinateur → tâche.
      def validate_item
        item = EventActionItem.find(params[:id])
        assignee = params[:assignee_id].present? ? Member.find(params[:assignee_id]) : nil
        task = Meetings::ActionItemValidator.call(item, validated_by: current_member, assignee: assignee)

        render json: { item: serialize(item.reload), taskId: task.id.to_s }
      end

      # GET event-action-items/pending — vue « tâches en attente de validation ».
      def pending
        items = EventActionItem.proposed.includes(:event).ordered
        render json: { items: items.map { |item| serialize(item) } }
      end

      private

      def extract_description(raw)
        (raw.is_a?(ActionController::Parameters) || raw.is_a?(Hash) ? raw[:description] : raw).to_s.strip
      end

      def serialize(item)
        {
          id: item.id.to_s,
          eventId: item.event_id.to_s,
          eventTitle: item.event.title,
          description: item.description,
          status: item.status,
          assigneeId: item.assignee_id&.to_s,
          taskId: item.task_id&.to_s,
          position: item.position
        }
      end
    end
  end
end
