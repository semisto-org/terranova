class AddStockKindToShopProducts < ActiveRecord::Migration[8.1]
  def change
    add_column :shop_products, :stock_kind, :string, default: "owned", null: false
  end
end
