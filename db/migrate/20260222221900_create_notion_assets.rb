class CreateNotionAssets < ActiveRecord::Migration[8.0]
  def change
    unless table_exists?(:notion_assets)
      create_table :notion_assets do |t|
        t.string :notion_url
        t.string :original_url
        t.string :source_type
        t.string :source_id
        t.string :property_name
        t.string :filename
        t.string :content_type
        t.datetime :downloaded_at
        t.references :notion_record, foreign_key: true, null: true
        t.string :attachable_type
        t.bigint :attachable_id
        t.timestamps
      end

      add_index :notion_assets, :notion_url
      add_index :notion_assets, :source_id
      add_index :notion_assets, [:attachable_type, :attachable_id]
    end
  end
end
