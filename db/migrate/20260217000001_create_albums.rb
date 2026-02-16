# frozen_string_literal: true

class CreateAlbums < ActiveRecord::Migration[8.1]
  def change
    create_table :albums do |t|
      t.string :title, null: false
      t.text :description, default: ""
      t.string :albumable_type
      t.bigint :albumable_id
      t.string :status, default: "active", null: false
      t.datetime :deleted_at
      t.timestamps
    end

    add_index :albums, [:albumable_type, :albumable_id], unique: true, where: "albumable_type IS NOT NULL AND albumable_id IS NOT NULL"
    add_index :albums, :deleted_at

    create_table :album_media_items do |t|
      t.references :album, null: false, foreign_key: true
      t.string :media_type, null: false
      t.string :caption, default: ""
      t.string :uploaded_by, default: "team", null: false
      t.datetime :taken_at
      t.string :device_make, default: ""
      t.string :device_model, default: ""
      t.jsonb :exif_data, default: {}
      t.integer :width
      t.integer :height
      t.datetime :deleted_at
      t.timestamps
    end

    add_index :album_media_items, :deleted_at
    add_index :album_media_items, :taken_at
  end
end
