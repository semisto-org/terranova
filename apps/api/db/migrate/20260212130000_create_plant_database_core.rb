class CreatePlantDatabaseCore < ActiveRecord::Migration[7.1]
  def change
    create_table :plant_genera do |t|
      t.string :latin_name, null: false
      t.text :description, null: false, default: ""
      t.timestamps
    end
    add_index :plant_genera, :latin_name, unique: true

    create_table :plant_species do |t|
      t.references :genus, foreign_key: { to_table: :plant_genera }
      t.string :latin_name, null: false
      t.string :plant_type, null: false
      t.jsonb :edible_parts, null: false, default: []
      t.jsonb :interests, null: false, default: []
      t.jsonb :ecosystem_needs, null: false, default: []
      t.jsonb :propagation_methods, null: false, default: []
      t.string :origin, null: false, default: ""
      t.jsonb :flower_colors, null: false, default: []
      t.jsonb :planting_seasons, null: false, default: []
      t.jsonb :harvest_months, null: false, default: []
      t.jsonb :exposures, null: false, default: []
      t.string :hardiness, null: false, default: ""
      t.jsonb :fruiting_months, null: false, default: []
      t.jsonb :flowering_months, null: false, default: []
      t.string :foliage_type, null: false, default: "deciduous"
      t.jsonb :native_countries, null: false, default: []
      t.string :fertility, null: false, default: "self-fertile"
      t.string :root_system, null: false, default: "fibrous"
      t.string :growth_rate, null: false, default: "medium"
      t.string :forest_garden_zone, null: false, default: "edge"
      t.string :pollination_type, null: false, default: "insect"
      t.jsonb :soil_types, null: false, default: []
      t.string :soil_moisture, null: false, default: "moist"
      t.string :soil_richness, null: false, default: "moderate"
      t.string :watering_need, null: false, default: "3"
      t.text :toxic_elements
      t.boolean :is_invasive, null: false, default: false
      t.text :therapeutic_properties
      t.string :life_cycle, null: false, default: "perennial"
      t.string :foliage_color, null: false, default: "green"
      t.string :fragrance, null: false, default: "none"
      t.jsonb :transformations, null: false, default: []
      t.jsonb :fodder_qualities, null: false, default: []
      t.timestamps
    end
    add_index :plant_species, :latin_name, unique: true

    create_table :plant_varieties do |t|
      t.references :species, null: false, foreign_key: { to_table: :plant_species }
      t.string :latin_name, null: false
      t.string :productivity, null: false, default: ""
      t.string :fruit_size, null: false, default: ""
      t.integer :taste_rating, null: false, default: 3
      t.string :storage_life, null: false, default: ""
      t.string :maturity, null: false, default: ""
      t.string :disease_resistance, null: false, default: ""
      t.timestamps
    end

    create_table :plant_common_names do |t|
      t.string :target_type, null: false
      t.bigint :target_id, null: false
      t.string :language, null: false
      t.string :name, null: false
      t.timestamps
    end
    add_index :plant_common_names, [:target_type, :target_id]

    create_table :plant_references do |t|
      t.string :target_type, null: false
      t.bigint :target_id, null: false
      t.string :reference_type, null: false
      t.string :title, null: false
      t.string :url, null: false
      t.string :source, null: false, default: ""
      t.timestamps
    end
    add_index :plant_references, [:target_type, :target_id]

    create_table :plant_contributors do |t|
      t.string :name, null: false
      t.string :avatar_url, null: false, default: ""
      t.date :joined_at, null: false
      t.string :lab_id
      t.integer :species_created, null: false, default: 0
      t.integer :varieties_created, null: false, default: 0
      t.integer :photos_added, null: false, default: 0
      t.integer :notes_written, null: false, default: 0
      t.integer :semos_earned, null: false, default: 0
      t.jsonb :activity_by_month, null: false, default: []
      t.timestamps
    end

    create_table :plant_photos do |t|
      t.string :target_type, null: false
      t.bigint :target_id, null: false
      t.string :url, null: false
      t.string :caption, null: false, default: ""
      t.references :contributor, null: false, foreign_key: { to_table: :plant_contributors }
      t.timestamps
    end
    add_index :plant_photos, [:target_type, :target_id]

    create_table :plant_notes do |t|
      t.string :target_type, null: false
      t.bigint :target_id, null: false
      t.references :contributor, null: false, foreign_key: { to_table: :plant_contributors }
      t.text :content, null: false
      t.string :language, null: false, default: "fr"
      t.jsonb :photos, null: false, default: []
      t.timestamps
    end
    add_index :plant_notes, [:target_type, :target_id]

    create_table :plant_locations do |t|
      t.string :target_type, null: false
      t.bigint :target_id, null: false
      t.decimal :latitude, precision: 10, scale: 6, null: false
      t.decimal :longitude, precision: 10, scale: 6, null: false
      t.string :place_name, null: false, default: ""
      t.string :lab_id
      t.boolean :is_mother_plant, null: false, default: false
      t.integer :planted_year
      t.boolean :is_public, null: false, default: true
      t.timestamps
    end
    add_index :plant_locations, [:target_type, :target_id]

    create_table :plant_nursery_stocks do |t|
      t.string :target_type, null: false
      t.bigint :target_id, null: false
      t.string :nursery_id, null: false
      t.string :nursery_name, null: false
      t.integer :quantity, null: false, default: 0
      t.string :rootstock
      t.string :age, null: false, default: ""
      t.decimal :price, precision: 10, scale: 2, null: false, default: 0
      t.timestamps
    end
    add_index :plant_nursery_stocks, [:target_type, :target_id]

    create_table :plant_activity_items do |t|
      t.string :activity_type, null: false
      t.references :contributor, null: false, foreign_key: { to_table: :plant_contributors }
      t.string :target_type, null: false
      t.bigint :target_id, null: false
      t.string :target_name, null: false
      t.datetime :timestamp, null: false
      t.timestamps
    end

    create_table :plant_palettes do |t|
      t.string :name, null: false
      t.text :description, null: false, default: ""
      t.string :created_by, null: false
      t.timestamps
    end

    create_table :plant_palette_items do |t|
      t.references :palette, null: false, foreign_key: { to_table: :plant_palettes }
      t.string :item_type, null: false
      t.bigint :item_id, null: false
      t.string :strate_key, null: false
      t.integer :position, null: false, default: 0
      t.timestamps
    end
    add_index :plant_palette_items, [:palette_id, :item_type, :item_id], unique: true

    create_table :plant_ai_summaries do |t|
      t.string :target_type, null: false
      t.bigint :target_id, null: false
      t.string :status, null: false, default: "idle"
      t.text :content
      t.datetime :generated_at
      t.text :error
      t.timestamps
    end
    add_index :plant_ai_summaries, [:target_type, :target_id], unique: true
  end
end
