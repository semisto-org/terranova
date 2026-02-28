class AddSpeciesIdToEconomicOutputs < ActiveRecord::Migration[8.0]
  def change
    add_reference :economic_outputs, :species, foreign_key: { to_table: :plant_species }, null: true
  end
end
