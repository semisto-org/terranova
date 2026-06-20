# frozen_string_literal: true

module Api
  module V1
    # Abonnements polymorphes (#103).
    # Suivre / ne plus suivre un objet : routes imbriquées par parent
    # (même pattern que CommentsController) — GET = état, POST = suivre
    # (explicit), DELETE = ne plus suivre (unsubscribed, jamais écrasé par
    # un abonnement auto futur).
    # Mute projet : POST/DELETE/GET projects/:type/:id/mute (Projectable).
    class SubscriptionsController < BaseController
      PARENTS = {
        "task_id" => Task,
        "event_id" => Event,
        "post_id" => Post,
        "deliberation_id" => ::Strategy::Deliberation,
      }.freeze

      before_action :set_subscribable, except: [:mute, :unmute, :mute_state]
      before_action :set_projectable, only: [:mute, :unmute, :mute_state]

      def show
        render json: subscription_payload
      end

      def create
        @subscribable.subscribe!(current_member)
        render json: subscription_payload, status: :created
      end

      def destroy
        @subscribable.unsubscribe!(current_member)
        render json: subscription_payload
      end

      def mute
        @projectable.mute!(current_member)
        render json: mute_payload, status: :created
      end

      def unmute
        @projectable.unmute!(current_member)
        render json: mute_payload
      end

      def mute_state
        render json: mute_payload
      end

      private

      def set_subscribable
        param_key, parent_class = PARENTS.find { |key, _| params[key].present? }
        return render json: { error: "Parent suivable manquant." }, status: :bad_request unless param_key

        @subscribable = parent_class.find(params[param_key])
      end

      def set_projectable
        @projectable = Projectable::PROJECT_TYPE_KEYS.key(params[:type])&.constantize&.find(params[:id])
        render json: { error: "Type de projet inconnu." }, status: :bad_request unless @projectable
      end

      def subscription_payload
        state = @subscribable.subscription_for(current_member)&.state
        {
          subscribed: Subscription::ACTIVE_STATES.include?(state),
          state: state,
        }
      end

      def mute_payload
        { muted: @projectable.muted_by?(current_member) }
      end
    end
  end
end
