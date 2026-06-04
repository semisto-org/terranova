class CreateDesignAnalysisSections < ActiveRecord::Migration[8.1]
  def change
    create_table :design_analysis_sections do |t|
      t.references :project, null: false,
                             foreign_key: { to_table: :design_projects },
                             index: true
      t.string :node_key, null: false
      t.jsonb :data, null: false, default: {}

      t.timestamps
    end

    add_index :design_analysis_sections, %i[project_id node_key], unique: true,
                                                                  name: 'index_design_analysis_sections_on_project_and_node'
  end
end
