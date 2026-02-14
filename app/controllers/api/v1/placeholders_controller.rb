module Api
  module V1
    class PlaceholdersController < BaseController
      skip_before_action :require_authentication
      def show
        render json: {
          milestone: "foundation",
          route: params[:route],
          section: params[:section],
          status: "placeholder",
          message: "Endpoint scaffolded for milestone sequencing."
        }
      end
    end
  end
end
