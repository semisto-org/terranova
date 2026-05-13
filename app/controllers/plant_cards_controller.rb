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

  def nursery_stock
    nursery = Nursery::Nursery.where(nursery_type: 'semisto').find(params[:nursery_id])

    species_ids = Nursery::StockBatch
      .where(nursery_id: nursery.id, status: %w[available in_production])
      .where('available_quantity > 0 OR status = ?', 'in_production')
      .distinct
      .pluck(:species_id)

    @species_list = Plant::Species
      .where(id: species_ids)
      .order(:latin_name)

    @page_title = "Fiches — #{nursery.name} (#{Date.current.strftime('%Y-%m-%d')})"

    render :batch, layout: 'plant_card_batch'
  end
end
