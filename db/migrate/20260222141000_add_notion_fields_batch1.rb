# frozen_string_literal: true

class AddNotionFieldsBatch1 < ActiveRecord::Migration[8.0]
  def change
    # === Plant Genera ===
    add_column :plant_genera, :notion_id, :string
    add_column :plant_genera, :common_name, :string, default: "", null: false
    add_column :plant_genera, :wikipedia_url, :string, default: "", null: false
    add_column :plant_genera, :notion_created_at, :datetime
    add_column :plant_genera, :notion_updated_at, :datetime
    add_index :plant_genera, :notion_id, unique: true

    # === Plant Species ===
    add_column :plant_species, :notion_id, :string
    add_column :plant_species, :description, :text, default: "", null: false
    add_column :plant_species, :height_description, :string, default: "", null: false
    add_column :plant_species, :spread_description, :string, default: "", null: false
    add_column :plant_species, :is_native_belgium, :boolean, default: false, null: false
    add_column :plant_species, :common_names_fr, :string, default: "", null: false
    add_column :plant_species, :notion_created_at, :datetime
    add_column :plant_species, :notion_updated_at, :datetime
    add_index :plant_species, :notion_id, unique: true

    # === Design Projects ===
    add_column :design_projects, :notion_id, :string
    add_column :design_projects, :project_type, :string, default: "", null: false
    add_column :design_projects, :google_photos_url, :string, default: "", null: false
    add_column :design_projects, :website_url, :string, default: "", null: false
    add_column :design_projects, :notion_created_at, :datetime
    add_column :design_projects, :notion_updated_at, :datetime
    add_index :design_projects, :notion_id, unique: true

    # === Design Project Timesheets ===
    add_column :design_project_timesheets, :notion_id, :string
    add_column :design_project_timesheets, :billed, :boolean, default: false, null: false
    add_column :design_project_timesheets, :training_id, :bigint
    add_column :design_project_timesheets, :notion_created_at, :datetime
    add_column :design_project_timesheets, :notion_updated_at, :datetime
    add_index :design_project_timesheets, :notion_id, unique: true

    # === Events ===
    add_column :events, :notion_id, :string
    add_column :events, :notion_created_at, :datetime
    add_column :events, :notion_updated_at, :datetime
    add_index :events, :notion_id, unique: true

    # === Design Quotes ===
    add_column :design_quotes, :notion_id, :string
    add_column :design_quotes, :sent_at, :date
    add_column :design_quotes, :accepted_at, :date
    add_column :design_quotes, :contact_id, :bigint
    add_column :design_quotes, :author_name, :string, default: "", null: false
    add_column :design_quotes, :notion_created_at, :datetime
    add_column :design_quotes, :notion_updated_at, :datetime
    add_index :design_quotes, :notion_id, unique: true

    # === Design Project Documents ===
    add_column :design_project_documents, :notion_id, :string
    add_column :design_project_documents, :phase, :string, default: "", null: false
    add_column :design_project_documents, :notion_created_at, :datetime
    add_column :design_project_documents, :notion_updated_at, :datetime
    add_index :design_project_documents, :notion_id, unique: true
  end
end
