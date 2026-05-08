class PlantIllustrationsController < ApplicationController
  before_action :require_authentication

  def index
    render inertia: "Plants/Illustrations", props: {
      isAdmin: current_member&.is_admin? || false
    }
  end
end
