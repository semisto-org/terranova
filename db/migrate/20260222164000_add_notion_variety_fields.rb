class AddNotionVarietyFields < ActiveRecord::Migration[8.0]
  def change
    add_column :plant_varieties, :common_names_fr, :string, default: "", null: false
    add_column :plant_varieties, :description, :text, default: "", null: false
    add_column :plant_varieties, :characteristics, :jsonb, default: [], null: false
    add_column :plant_varieties, :labels, :jsonb, default: [], null: false
    add_column :plant_varieties, :usages, :jsonb, default: [], null: false
    add_column :plant_varieties, :fertility, :string, default: "", null: false
    add_column :plant_varieties, :juice_quality, :string, default: "", null: false
    add_column :plant_varieties, :publish_on_website, :boolean, default: false, null: false
  end
end
