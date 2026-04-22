# frozen_string_literal: true

module Shop
  class Sale < ApplicationRecord
    self.table_name = "shop_sales"

    PAYMENT_METHODS = %w[cash transfer card stripe other].freeze

    belongs_to :organization
    belongs_to :contact, optional: true
    belongs_to :revenue, optional: true
    has_many :items, class_name: "Shop::SaleItem", foreign_key: :shop_sale_id, inverse_of: :sale

    accepts_nested_attributes_for :items, allow_destroy: true

    validates :sold_at, presence: true
    validates :payment_method, inclusion: { in: PAYMENT_METHODS }
    validate :has_at_least_one_item

    attr_accessor :skip_stock_decrement, :skip_revenue_generation, :skip_cash_movement

    after_create :apply_stock_decrement!, unless: :skip_stock_decrement
    after_create :generate_revenue!, unless: :skip_revenue_generation
    after_create :record_cash_movement!, unless: :skip_cash_movement
    before_destroy :snapshot_and_delete_items!, prepend: true
    after_destroy :unrecord_cash_movement!
    after_destroy :restore_stock!
    after_destroy :destroy_revenue!

    def total_amount
      items.sum { |i| i.subtotal }
    end

    def label
      snippet =
        if items.size <= 2
          items.map { |i| "#{i.quantity}× #{i.product.name}" }.join(", ")
        else
          first = items.first
          "#{items.size} articles (dont #{first.quantity}× #{first.product.name})"
        end
      "Vente comptoir · #{snippet}"
    end

    def resync_revenue!
      Shop::RevenueGenerator.new(self).sync!
    end

    def record_cash_movement!
      Cash::Bookkeeper.record_shop_sale(self) if payment_method == "cash"
    end

    def unrecord_cash_movement!
      Cash::Bookkeeper.unrecord_shop_sale(self)
    end

    private

    def has_at_least_one_item
      errors.add(:base, "Au moins un produit est requis") if items.empty? || items.all?(&:marked_for_destruction?)
    end

    def apply_stock_decrement!
      Shop::Sale.transaction do
        items.each do |item|
          product = item.product
          new_qty = product.stock_quantity.to_i - item.quantity.to_i
          product.update_columns(stock_quantity: new_qty, updated_at: Time.current)
        end
      end
    end

    def snapshot_and_delete_items!
      @item_snapshot = items.reload.map { |i| [i.shop_product_id, i.quantity.to_i] }
      Shop::SaleItem.where(shop_sale_id: id).delete_all
    end

    def restore_stock!
      return unless @item_snapshot
      @item_snapshot.each do |product_id, qty|
        product = Shop::Product.find_by(id: product_id)
        next unless product
        product.update_columns(
          stock_quantity: product.stock_quantity.to_i + qty,
          updated_at: Time.current
        )
      end
    end

    def generate_revenue!
      Shop::RevenueGenerator.new(reload).sync!
    end

    def destroy_revenue!
      revenue&.destroy
    end
  end
end
