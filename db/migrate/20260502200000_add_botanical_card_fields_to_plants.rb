class AddBotanicalCardFieldsToPlants < ActiveRecord::Migration[8.1]
  def change
    add_column :plant_species, :growth_habit, :string

    add_column :plant_species, :height_min_cm, :integer
    add_column :plant_species, :height_max_cm, :integer
    add_column :plant_species, :spread_min_cm, :integer
    add_column :plant_species, :spread_max_cm, :integer

    add_column :plant_species, :edible_rating, :integer
    add_column :plant_species, :medicinal_rating, :integer

    add_column :plant_photos, :role, :string
    add_index  :plant_photos, :role
  end
end
