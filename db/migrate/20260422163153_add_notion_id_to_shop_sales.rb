class AddNotionIdToShopSales < ActiveRecord::Migration[8.1]
  def change
    add_column :shop_sales, :notion_id, :string
    add_column :shop_sales, :notion_created_at, :datetime
    add_column :shop_sales, :notion_updated_at, :datetime
    add_index :shop_sales, :notion_id, unique: true, where: "notion_id IS NOT NULL"
  end
end
