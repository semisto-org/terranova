# frozen_string_literal: true

class CreateDesignProjectClients < ActiveRecord::Migration[8.1]
  def change
    create_table :design_project_clients do |t|
      t.references :project, null: false,
                   foreign_key: { to_table: :design_projects }, index: true
      t.references :contact, null: false,
                   foreign_key: { to_table: :contacts }, index: true
      t.boolean :is_primary, null: false, default: false
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :design_project_clients, %i[project_id contact_id], unique: true,
              name: "index_design_project_clients_on_project_and_contact"
  end
end
