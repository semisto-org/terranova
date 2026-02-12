class CreateDesignStudioCore < ActiveRecord::Migration[7.1]
  def change
    create_table :design_project_templates do |t|
      t.string :name, null: false
      t.text :description, null: false, default: ""
      t.jsonb :default_phases, null: false, default: []
      t.integer :suggested_hours, null: false, default: 0
      t.decimal :suggested_budget, precision: 12, scale: 2, null: false, default: 0
      t.timestamps
    end

    create_table :design_projects do |t|
      t.string :name, null: false
      t.string :client_id, null: false
      t.string :client_name, null: false
      t.string :client_email, null: false, default: ""
      t.string :client_phone, null: false, default: ""
      t.string :place_id, null: false, default: ""
      t.string :address, null: false, default: ""
      t.decimal :latitude, precision: 10, scale: 6, null: false, default: 0
      t.decimal :longitude, precision: 10, scale: 6, null: false, default: 0
      t.integer :area, null: false, default: 0
      t.string :phase, null: false, default: 'offre'
      t.string :status, null: false, default: 'pending'
      t.date :start_date
      t.date :planting_date
      t.string :project_manager_id, null: false, default: ''
      t.references :template, foreign_key: { to_table: :design_project_templates }

      t.integer :hours_planned, null: false, default: 0
      t.integer :hours_worked, null: false, default: 0
      t.integer :hours_billed, null: false, default: 0
      t.integer :hours_semos, null: false, default: 0
      t.decimal :expenses_budget, precision: 12, scale: 2, null: false, default: 0
      t.decimal :expenses_actual, precision: 12, scale: 2, null: false, default: 0

      t.timestamps
    end

    add_index :design_projects, :phase
    add_index :design_projects, :status
    add_index :design_projects, :updated_at

    create_table :design_project_meetings do |t|
      t.references :project, null: false, foreign_key: { to_table: :design_projects }
      t.string :title, null: false
      t.datetime :starts_at, null: false
      t.integer :duration_minutes, null: false, default: 60
      t.string :location, null: false, default: ''
      t.timestamps
    end

    add_index :design_project_meetings, :starts_at
  end
end
