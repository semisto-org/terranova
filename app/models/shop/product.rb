# frozen_string_literal: true

module Shop
  class Product < ApplicationRecord
    self.table_name = "shop_products"

    VAT_RATES = %w[0 6 12 21 exempt].freeze

    has_many :sale_items, class_name: "Shop::SaleItem", foreign_key: :shop_product_id, dependent: :restrict_with_error

    validates :name, presence: true
    validates :vat_rate, inclusion: { in: VAT_RATES }
    validates :stock_quantity, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    validates :unit_price, numericality: { greater_than_or_equal_to: 0 }

    scope :active, -> { where(archived_at: nil) }
    scope :archived, -> { where.not(archived_at: nil) }

    def archived?
      archived_at.present?
    end

    def in_stock?
      stock_quantity.to_i.positive?
    end

    def archive!
      update!(archived_at: Time.current)
    end

    def unarchive!
      update!(archived_at: nil)
    end
  end
end
