# frozen_string_literal: true

class CreateBatch2Models < ActiveRecord::Migration[8.0]
  def change
    create_table :locations do |t|
      t.string :name, null: false
      t.string :address
      t.string :country
      t.string :location_type
      t.string :website_url
      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 10, scale: 6
      t.string :notion_id
      t.datetime :notion_created_at
      t.datetime :notion_updated_at
      t.timestamps
    end
    add_index :locations, :notion_id, unique: true

    create_table :location_zones do |t|
      t.string :name, null: false
      t.references :location, foreign_key: { to_table: :locations }, null: true
      t.string :notion_id
      t.datetime :notion_created_at
      t.datetime :notion_updated_at
      t.timestamps
    end
    add_index :location_zones, :notion_id, unique: true

    create_table :plant_records do |t|
      t.string :name
      t.references :species, foreign_key: { to_table: :plant_species }, null: true
      t.references :variety, foreign_key: { to_table: :plant_varieties }, null: true
      t.references :location, foreign_key: { to_table: :locations }, null: true
      t.references :zone, foreign_key: { to_table: :location_zones }, null: true
      t.date :planting_date
      t.decimal :purchase_price, precision: 10, scale: 2
      t.integer :quantity
      t.integer :altitude
      t.string :status
      t.string :health_status
      t.string :population
      t.string :plant_type_category
      t.string :nursery_source
      t.text :notes
      t.string :notion_id
      t.datetime :notion_created_at
      t.datetime :notion_updated_at
      t.timestamps
    end
    add_index :plant_records, :notion_id, unique: true

    create_table :pole_projects do |t|
      t.string :name, null: false
      t.string :status
      t.string :lead_name
      t.jsonb :team_names, default: []
      t.boolean :needs_reclassification, default: false
      t.string :notion_id
      t.datetime :notion_created_at
      t.datetime :notion_updated_at
      t.timestamps
    end
    add_index :pole_projects, :notion_id, unique: true

    create_table :actions do |t|
      t.string :name
      t.string :status
      t.string :priority
      t.date :due_date
      t.integer :time_minutes
      t.string :assignee_name
      t.string :action_type
      t.jsonb :tags, default: []
      t.references :parent, foreign_key: { to_table: :actions }, null: true
      t.references :pole_project, foreign_key: { to_table: :pole_projects }, null: true
      t.references :training, foreign_key: { to_table: :academy_trainings }, null: true
      t.string :notion_id
      t.datetime :notion_created_at
      t.datetime :notion_updated_at
      t.timestamps
    end
    add_index :actions, :notion_id, unique: true

    create_table :design_actions do |t|
      t.string :name
      t.string :status
      t.string :priority
      t.date :due_date
      t.integer :time_minutes
      t.decimal :time_planned_hours, precision: 5, scale: 2
      t.string :assignee_name
      t.string :phase
      t.references :design_project, foreign_key: { to_table: :design_projects }, null: true
      t.string :notion_id
      t.datetime :notion_created_at
      t.datetime :notion_updated_at
      t.timestamps
    end
    add_index :design_actions, :notion_id, unique: true

    create_table :post_its do |t|
      t.string :title
      t.text :body
      t.string :post_type
      t.string :author_name
      t.date :date
      t.references :design_project, foreign_key: { to_table: :design_projects }, null: true
      t.references :training, foreign_key: { to_table: :academy_trainings }, null: true
      t.references :pole_project, foreign_key: { to_table: :pole_projects }, null: true
      t.string :notion_id
      t.datetime :notion_created_at
      t.datetime :notion_updated_at
      t.timestamps
    end
    add_index :post_its, :notion_id, unique: true

    create_table :notes do |t|
      t.string :title
      t.text :body
      t.string :note_type
      t.jsonb :tags, default: []
      t.string :author_name
      t.boolean :archived, default: false
      t.string :url
      t.references :pole_project, foreign_key: { to_table: :pole_projects }, null: true
      t.string :notion_id
      t.datetime :notion_created_at
      t.datetime :notion_updated_at
      t.timestamps
    end
    add_index :notes, :notion_id, unique: true
  end
end
