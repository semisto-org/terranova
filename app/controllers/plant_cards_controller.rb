class PlantCardsController < ApplicationController
  before_action :require_authentication
  layout "plant_card"

  def show
    @species = Plant::Species.find(params[:id])
    @photos = Plant::Photo.where(target_type: 'species', target_id: @species.id)
  end
end
