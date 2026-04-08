# frozen_string_literal: true

class AddProjectableToExpensesRevenuesTimesheetsEventsKnowledgeSections < ActiveRecord::Migration[8.1]
  def change
    # Expenses: currently uses design_project_id + training_id
    add_column :expenses, :projectable_type, :string
    add_column :expenses, :projectable_id, :bigint
    add_index :expenses, [:projectable_type, :projectable_id], name: "index_expenses_on_projectable"

    # Revenues: currently uses design_project_id + training_id
    add_column :revenues, :projectable_type, :string
    add_column :revenues, :projectable_id, :bigint
    add_index :revenues, [:projectable_type, :projectable_id], name: "index_revenues_on_projectable"

    # Timesheets: currently uses design_project_id + training_id + pole_project_id
    add_column :timesheets, :projectable_type, :string
    add_column :timesheets, :projectable_id, :bigint
    add_index :timesheets, [:projectable_type, :projectable_id], name: "index_timesheets_on_projectable"

    # Events: currently uses pole_project_id
    add_column :events, :projectable_type, :string
    add_column :events, :projectable_id, :bigint
    add_index :events, [:projectable_type, :projectable_id], name: "index_events_on_projectable"

    # KnowledgeSections: currently uses guild_id
    add_column :knowledge_sections, :projectable_type, :string
    add_column :knowledge_sections, :projectable_id, :bigint
    add_index :knowledge_sections, [:projectable_type, :projectable_id], name: "index_knowledge_sections_on_projectable"
  end
end
