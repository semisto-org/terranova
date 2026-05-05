class AddPruningMonthsToPlantSpecies < ActiveRecord::Migration[8.1]
  def change
    add_column :plant_species, :pruning_months, :jsonb, default: [], null: false
  end
end
