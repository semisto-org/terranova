# frozen_string_literal: true

class CreateNotionRecords < ActiveRecord::Migration[7.1]
  def change
    create_table :notion_records do |t|
      t.string :notion_id, null: false
      t.string :database_name, null: false
      t.string :database_id, null: false
      t.string :title
      t.jsonb :properties, default: {}
      t.text :content
      t.text :content_html

      t.timestamps
    end

    add_index :notion_records, :notion_id, unique: true
    add_index :notion_records, :database_name
  end
end
