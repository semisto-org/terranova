# frozen_string_literal: true

class CreateNotionAssets < ActiveRecord::Migration[7.1]
  def change
    # Table already exists with basic columns; add missing columns for media pipeline
    add_column :notion_assets, :notion_url, :string unless column_exists?(:notion_assets, :notion_url)
    add_column :notion_assets, :source_type, :string unless column_exists?(:notion_assets, :source_type)
    add_column :notion_assets, :source_id, :string unless column_exists?(:notion_assets, :source_id)
    add_column :notion_assets, :property_name, :string unless column_exists?(:notion_assets, :property_name)
    add_column :notion_assets, :downloaded_at, :datetime unless column_exists?(:notion_assets, :downloaded_at)
    add_column :notion_assets, :attachable_type, :string unless column_exists?(:notion_assets, :attachable_type)
    add_column :notion_assets, :attachable_id, :integer unless column_exists?(:notion_assets, :attachable_id)

    add_index :notion_assets, :notion_url unless index_exists?(:notion_assets, :notion_url)
    add_index :notion_assets, :source_id unless index_exists?(:notion_assets, :source_id)
    add_index :notion_assets, [:attachable_type, :attachable_id] unless index_exists?(:notion_assets, [:attachable_type, :attachable_id])
  end
end
