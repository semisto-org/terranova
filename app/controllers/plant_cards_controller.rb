class PlantCardsController < ApplicationController
  before_action :require_authentication
  layout "plant_card"

  def show
    @species = Plant::Species.find(params[:id])
    @photos = Plant::Photo.where(target_type: 'species', target_id: @species.id)
  end

  def batch
    ids = params[:ids].to_s.split(',').map(&:strip).reject(&:empty?).map(&:to_i)
    if ids.empty? || ids.size > 24
      head :unprocessable_entity and return
    end

    @species_list = Plant::Species
      .where(id: ids)
      .order(Arel.sql("array_position(ARRAY[#{ids.join(',')}]::int[], id)"))

    @photos_by_species = Plant::Photo
      .where(target_type: 'species', target_id: ids)
      .group_by(&:target_id)

    render :batch
  end
end
