class AllowNullAllelopathyOnPlantSpecies < ActiveRecord::Migration[8.1]
  def change
    change_column_null :plant_species, :allelopathy, true
    change_column_default :plant_species, :allelopathy, from: "", to: nil
  end
end
