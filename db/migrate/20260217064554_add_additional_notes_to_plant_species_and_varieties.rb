class AddAdditionalNotesToPlantSpeciesAndVarieties < ActiveRecord::Migration[8.0]
  def change
    add_column :plant_species, :additional_notes, :text
    add_column :plant_varieties, :additional_notes, :text, default: "", null: false
  end
end
