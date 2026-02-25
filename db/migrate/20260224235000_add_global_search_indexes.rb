class AddGlobalSearchIndexes < ActiveRecord::Migration[8.0]
  def change
    enable_extension "pg_trgm" unless extension_enabled?("pg_trgm")

    add_index :design_projects, :name, using: :gin, opclass: :gin_trgm_ops, name: "idx_design_projects_name_trgm"
    add_index :contacts, :name, using: :gin, opclass: :gin_trgm_ops, name: "idx_contacts_name_trgm"
    add_index :plant_species, :latin_name, using: :gin, opclass: :gin_trgm_ops, name: "idx_plant_species_latin_name_trgm"
    add_index :academy_trainings, :title, using: :gin, opclass: :gin_trgm_ops, name: "idx_academy_trainings_title_trgm"
    add_index :notes, :title, using: :gin, opclass: :gin_trgm_ops, name: "idx_notes_title_trgm"
    add_index :knowledge_topics, :title, using: :gin, opclass: :gin_trgm_ops, name: "idx_knowledge_topics_title_trgm"
    add_index :design_project_documents, :name, using: :gin, opclass: :gin_trgm_ops, name: "idx_design_project_documents_name_trgm"
    add_index :notion_records, :title, using: :gin, opclass: :gin_trgm_ops, name: "idx_notion_records_title_trgm"
  end
end
