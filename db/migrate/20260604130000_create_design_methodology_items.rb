class CreateDesignMethodologyItems < ActiveRecord::Migration[8.1]
  def change
    create_table :design_methodology_items do |t|
      t.references :project, null: false,
                             foreign_key: { to_table: :design_projects },
                             index: true
      t.string :node_key, null: false
      t.string :status, null: false, default: 'todo'
      t.text :notes

      t.timestamps
    end

    add_index :design_methodology_items, %i[project_id node_key], unique: true,
                                                                   name: 'index_design_methodology_items_on_project_and_node'
  end
end
