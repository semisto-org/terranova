class AddNotionFieldsToPlantVarieties < ActiveRecord::Migration[8.0]
  def change
    add_column :plant_varieties, :notion_id, :string
    add_column :plant_varieties, :notion_created_at, :datetime
    add_column :plant_varieties, :notion_updated_at, :datetime
    add_index :plant_varieties, :notion_id, unique: true

    change_column_null :plant_varieties, :species_id, true
  end
end
