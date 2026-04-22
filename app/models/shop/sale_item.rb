# frozen_string_literal: true

module Shop
  class SaleItem < ApplicationRecord
    self.table_name = "shop_sale_items"

    belongs_to :sale, class_name: "Shop::Sale", foreign_key: :shop_sale_id
    belongs_to :product, class_name: "Shop::Product", foreign_key: :shop_product_id

    validates :quantity, numericality: { only_integer: true, greater_than: 0 }
    validates :unit_price, numericality: { greater_than_or_equal_to: 0 }
    validates :vat_rate, inclusion: { in: Shop::Product::VAT_RATES }

    def subtotal
      (quantity.to_i * unit_price.to_d).round(2)
    end
  end
end
