class CreateDesignPlantingAndCogestionCore < ActiveRecord::Migration[7.1]
  def change
    create_table :design_planting_plans do |t|
      t.references :project, null: false, index: false, foreign_key: { to_table: :design_projects }
      t.string :image_url, null: false, default: ''
      t.string :layout, null: false, default: 'split-3-4-1-4'
      t.timestamps
    end
    add_index :design_planting_plans, :project_id, unique: true

    create_table :design_plant_markers do |t|
      t.references :planting_plan, null: false, foreign_key: { to_table: :design_planting_plans }
      t.references :palette_item, foreign_key: { to_table: :design_project_palette_items }
      t.integer :number, null: false
      t.decimal :x, precision: 8, scale: 4, null: false
      t.decimal :y, precision: 8, scale: 4, null: false
      t.string :species_name, null: false
      t.timestamps
    end
    add_index :design_plant_markers, [:planting_plan_id, :number], unique: true, name: 'idx_design_plant_markers_number_per_plan'

    create_table :design_plant_records do |t|
      t.references :project, null: false, foreign_key: { to_table: :design_projects }
      t.references :marker, foreign_key: { to_table: :design_plant_markers }
      t.references :palette_item, foreign_key: { to_table: :design_project_palette_items }
      t.string :status, null: false, default: 'alive'
      t.integer :health_score, null: false, default: 100
      t.text :notes, null: false, default: ''
      t.timestamps
    end

    create_table :design_follow_up_visits do |t|
      t.references :project, null: false, foreign_key: { to_table: :design_projects }
      t.date :date, null: false
      t.string :visit_type, null: false
      t.text :notes, null: false, default: ''
      t.jsonb :photos, null: false, default: []
      t.timestamps
    end

    create_table :design_interventions do |t|
      t.references :project, null: false, foreign_key: { to_table: :design_projects }
      t.references :plant_record, foreign_key: { to_table: :design_plant_records }
      t.date :date, null: false
      t.string :intervention_type, null: false
      t.text :notes, null: false, default: ''
      t.timestamps
    end
  end
end
