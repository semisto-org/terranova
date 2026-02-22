class AddNotionFieldsToPlantVarieties < ActiveRecord::Migration[8.0]
  def change
    unless column_exists?(:plant_varieties, :notion_id)
      add_column :plant_varieties, :notion_id, :string
    end
    unless column_exists?(:plant_varieties, :notion_created_at)
      add_column :plant_varieties, :notion_created_at, :datetime
    end
    unless column_exists?(:plant_varieties, :notion_updated_at)
      add_column :plant_varieties, :notion_updated_at, :datetime
    end
    unless index_exists?(:plant_varieties, :notion_id)
      add_index :plant_varieties, :notion_id, unique: true
    end

    change_column_null :plant_varieties, :species_id, true
  end
end
