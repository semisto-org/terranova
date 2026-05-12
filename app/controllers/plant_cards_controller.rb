class PlantCardsController < ApplicationController
  before_action :require_authentication
  layout "plant_card"

  def show
    @species = Plant::Species.find(params[:id])
  end

  def batch
    ids = params[:ids].to_s.split(',').map(&:strip).reject(&:empty?).map(&:to_i)
    if ids.empty? || ids.size > 24
      head :unprocessable_entity and return
    end

    @species_list = Plant::Species
      .where(id: ids)
      .order(Arel.sql("array_position(ARRAY[#{ids.join(',')}]::int[], id)"))

    render :batch, layout: 'plant_card_batch'
  end
end
