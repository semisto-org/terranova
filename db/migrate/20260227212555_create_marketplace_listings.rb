class CreateMarketplaceListings < ActiveRecord::Migration[8.1]
  def change
    create_table :marketplace_listings do |t|
      t.string :title, null: false
      t.text :description, default: "", null: false
      t.integer :price_semos, null: false
      t.string :category, null: false
      t.string :status, default: "active", null: false
      t.references :member, null: false, foreign_key: true
      t.datetime :deleted_at
      t.timestamps
    end

    add_index :marketplace_listings, [:status, :deleted_at]
    add_index :marketplace_listings, :category
  end
end
