module Api
  module V1
    class BaseController < ApplicationController
      before_action :require_authentication, unless: -> { Rails.env.test? }

      rescue_from ActionController::InvalidAuthenticityToken do
        render json: { error: "Token CSRF invalide. Rechargez la page." }, status: :unprocessable_entity
      end
    end
  end
end
