class PlantCardsController < ApplicationController
  before_action :require_authentication
  layout "plant_card"

  def show
    @species = Plant::Species.find(params[:id])
  end
end
