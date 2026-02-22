class AddNotionIdToPlantVarieties < ActiveRecord::Migration[8.0]
  def change
    add_column :plant_varieties, :notion_id, :string
    add_column :plant_varieties, :notion_created_at, :datetime
    add_column :plant_varieties, :notion_updated_at, :datetime
    add_column :plant_varieties, :common_names_fr, :string, default: ""
    add_column :plant_varieties, :description, :text, default: ""
    add_column :plant_varieties, :characteristics, :jsonb, default: []
    add_column :plant_varieties, :labels, :jsonb, default: []
    add_column :plant_varieties, :usages, :jsonb, default: []
    add_column :plant_varieties, :fertility, :string, default: ""
    add_column :plant_varieties, :juice_quality, :string, default: ""
    add_column :plant_varieties, :publish_on_website, :boolean, default: false
    add_index :plant_varieties, :notion_id, unique: true

    # Make species_id nullable (some varieties not yet linked to species)
    change_column_null :plant_varieties, :species_id, true
  end
end
