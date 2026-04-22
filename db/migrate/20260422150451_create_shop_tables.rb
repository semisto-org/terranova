class CreateShopTables < ActiveRecord::Migration[8.1]
  def change
    create_table :shop_products do |t|
      t.text :name, null: false
      t.text :description, default: "", null: false
      t.string :sku
      t.decimal :unit_price, precision: 12, scale: 2, default: 0, null: false
      t.string :vat_rate, default: "6", null: false
      t.integer :stock_quantity, default: 0, null: false
      t.datetime :archived_at
      t.timestamps
    end
    add_index :shop_products, :archived_at
    add_index :shop_products, :sku, unique: true, where: "sku IS NOT NULL"

    create_table :shop_sales do |t|
      t.date :sold_at, null: false
      t.references :organization, null: false, foreign_key: true
      t.references :contact, foreign_key: true
      t.references :revenue, foreign_key: true
      t.string :payment_method, null: false
      t.text :notes, default: "", null: false
      t.text :customer_label, default: "", null: false
      t.timestamps
    end
    add_index :shop_sales, :sold_at

    create_table :shop_sale_items do |t|
      t.references :shop_sale, null: false, foreign_key: true
      t.references :shop_product, null: false, foreign_key: true
      t.integer :quantity, null: false
      t.decimal :unit_price, precision: 12, scale: 2, null: false
      t.string :vat_rate, null: false
      t.timestamps
    end
  end
end
