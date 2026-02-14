module Api
  module V1
    class HealthController < BaseController
      skip_before_action :require_authentication
      def show
        render json: {
          status: "ok",
          service: "terranova-api",
          timestamp: Time.current.iso8601
        }
      end
    end
  end
end
