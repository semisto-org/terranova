# frozen_string_literal: true

module Api
  module V1
    class BillingConfigController < BaseController
      before_action :require_admin, only: [:update]

      # GET /api/v1/billing-config
      def show
        render json: serialize_config(BillingConfig.instance)
      end

      # PATCH /api/v1/billing-config
      def update
        config = BillingConfig.instance
        config.update!(config_params)
        render json: serialize_config(config)
      end

      private

      def require_admin
        unless current_member&.is_admin?
          render json: { error: "Accès non autorisé" }, status: :forbidden
        end
      end

      def config_params
        params.permit(:hourly_rate, :asbl_support_rate)
      end

      def serialize_config(config)
        {
          hourlyRate: config.hourly_rate.to_f,
          asblSupportRate: config.asbl_support_rate.to_f
        }
      end
    end
  end
end
