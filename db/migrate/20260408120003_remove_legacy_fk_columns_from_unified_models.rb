# frozen_string_literal: true

class RemoveLegacyFkColumnsFromUnifiedModels < ActiveRecord::Migration[8.1]
  def up
    # Expenses: remove design_project_id, training_id
    remove_index :expenses, :design_project_id, if_exists: true
    remove_index :expenses, [:design_project_id, :invoice_date], if_exists: true
    remove_column :expenses, :design_project_id
    remove_column :expenses, :training_id

    # Revenues: remove design_project_id, training_id
    remove_index :revenues, :design_project_id, if_exists: true
    remove_index :revenues, [:design_project_id, :date], if_exists: true
    remove_index :revenues, :training_id, if_exists: true
    remove_column :revenues, :design_project_id
    remove_column :revenues, :training_id

    # Timesheets: remove design_project_id, training_id, pole_project_id
    remove_index :timesheets, :design_project_id, if_exists: true
    remove_index :timesheets, [:design_project_id, :date], if_exists: true
    remove_index :timesheets, :training_id, if_exists: true
    remove_index :timesheets, :pole_project_id, if_exists: true
    remove_column :timesheets, :design_project_id
    remove_column :timesheets, :training_id
    remove_column :timesheets, :pole_project_id

    # Events: remove pole_project_id
    remove_index :events, :pole_project_id, if_exists: true
    remove_column :events, :pole_project_id

    # KnowledgeSections: remove guild_id, replace unique index
    remove_index :knowledge_sections, [:guild_id, :name], if_exists: true
    remove_index :knowledge_sections, :guild_id, if_exists: true
    remove_column :knowledge_sections, :guild_id
    add_index :knowledge_sections, [:projectable_type, :projectable_id, :name],
              unique: true, name: "index_knowledge_sections_on_projectable_and_name"
  end

  def down
    # Re-add legacy columns
    add_column :expenses, :design_project_id, :bigint
    add_column :expenses, :training_id, :bigint
    add_index :expenses, :design_project_id
    add_index :expenses, [:design_project_id, :invoice_date]

    add_column :revenues, :design_project_id, :bigint
    add_column :revenues, :training_id, :bigint
    add_index :revenues, :design_project_id
    add_index :revenues, [:design_project_id, :date]
    add_index :revenues, :training_id

    add_column :timesheets, :design_project_id, :bigint
    add_column :timesheets, :training_id, :bigint
    add_column :timesheets, :pole_project_id, :bigint
    add_index :timesheets, :design_project_id
    add_index :timesheets, [:design_project_id, :date]
    add_index :timesheets, :training_id
    add_index :timesheets, :pole_project_id

    add_column :events, :pole_project_id, :bigint
    add_index :events, :pole_project_id

    remove_index :knowledge_sections, name: "index_knowledge_sections_on_projectable_and_name", if_exists: true
    add_column :knowledge_sections, :guild_id, :bigint
    add_index :knowledge_sections, :guild_id
    add_index :knowledge_sections, [:guild_id, :name], unique: true

    # Repopulate legacy columns from polymorphic
    execute "UPDATE expenses SET design_project_id = projectable_id WHERE projectable_type = 'Design::Project'"
    execute "UPDATE expenses SET training_id = projectable_id WHERE projectable_type = 'Academy::Training'"
    execute "UPDATE revenues SET design_project_id = projectable_id WHERE projectable_type = 'Design::Project'"
    execute "UPDATE revenues SET training_id = projectable_id WHERE projectable_type = 'Academy::Training'"
    execute "UPDATE timesheets SET design_project_id = projectable_id WHERE projectable_type = 'Design::Project'"
    execute "UPDATE timesheets SET training_id = projectable_id WHERE projectable_type = 'Academy::Training'"
    execute "UPDATE timesheets SET pole_project_id = projectable_id WHERE projectable_type = 'PoleProject'"
    execute "UPDATE events SET pole_project_id = projectable_id WHERE projectable_type = 'PoleProject'"
    execute "UPDATE knowledge_sections SET guild_id = projectable_id WHERE projectable_type = 'Guild'"
  end
end
