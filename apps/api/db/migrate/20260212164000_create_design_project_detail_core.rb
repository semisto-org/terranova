class CreateDesignProjectDetailCore < ActiveRecord::Migration[7.1]
  def change
    create_table :design_team_members do |t|
      t.references :project, null: false, foreign_key: { to_table: :design_projects }
      t.string :member_id, null: false
      t.string :member_name, null: false
      t.string :member_email, null: false, default: ''
      t.string :member_avatar, null: false, default: ''
      t.string :role, null: false
      t.boolean :is_paid, null: false, default: false
      t.datetime :assigned_at, null: false
      t.timestamps
    end
    add_index :design_team_members, [:project_id, :member_id, :role], unique: true, name: 'idx_design_team_member_unique_role'

    create_table :design_project_timesheets do |t|
      t.references :project, null: false, foreign_key: { to_table: :design_projects }
      t.string :member_id, null: false
      t.string :member_name, null: false
      t.date :date, null: false
      t.decimal :hours, precision: 5, scale: 2, null: false, default: 0
      t.string :phase, null: false
      t.string :mode, null: false
      t.integer :travel_km, null: false, default: 0
      t.text :notes, null: false, default: ''
      t.timestamps
    end

    create_table :design_expenses do |t|
      t.references :project, null: false, foreign_key: { to_table: :design_projects }
      t.date :date, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false, default: 0
      t.string :category, null: false
      t.text :description, null: false, default: ''
      t.string :phase, null: false
      t.string :member_id, null: false, default: ''
      t.string :member_name, null: false, default: ''
      t.string :receipt_url, null: false, default: ''
      t.string :status, null: false, default: 'pending'
      t.timestamps
    end

    create_table :design_site_analyses do |t|
      t.references :project, null: false, index: false, foreign_key: { to_table: :design_projects }
      t.jsonb :climate, null: false, default: {}
      t.jsonb :geomorphology, null: false, default: {}
      t.jsonb :water, null: false, default: {}
      t.jsonb :socio_economic, null: false, default: {}
      t.jsonb :access_data, null: false, default: {}
      t.jsonb :vegetation, null: false, default: {}
      t.jsonb :microclimate, null: false, default: {}
      t.jsonb :buildings, null: false, default: {}
      t.jsonb :soil, null: false, default: {}
      t.jsonb :client_observations, null: false, default: {}
      t.jsonb :client_photos, null: false, default: []
      t.jsonb :client_usage_map, null: false, default: []
      t.timestamps
    end
    add_index :design_site_analyses, :project_id, unique: true

    create_table :design_project_palettes do |t|
      t.references :project, null: false, index: false, foreign_key: { to_table: :design_projects }
      t.timestamps
    end
    add_index :design_project_palettes, :project_id, unique: true

    create_table :design_project_palette_items do |t|
      t.references :palette, null: false, foreign_key: { to_table: :design_project_palettes }
      t.string :species_id, null: false
      t.string :species_name, null: false
      t.string :common_name, null: false, default: ''
      t.string :variety_id
      t.string :variety_name
      t.string :layer, null: false
      t.integer :quantity, null: false, default: 1
      t.decimal :unit_price, precision: 10, scale: 2, null: false, default: 0
      t.text :notes, null: false, default: ''
      t.jsonb :harvest_months, null: false, default: []
      t.jsonb :harvest_products, null: false, default: []
      t.timestamps
    end
  end
end
