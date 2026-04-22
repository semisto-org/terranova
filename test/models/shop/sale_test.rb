# frozen_string_literal: true

require "test_helper"

class Shop::SaleTest < ActiveSupport::TestCase
  setup do
    @organization = Organization.find_or_create_by!(name: "Semisto Test") do |o|
      o.is_default = true
      o.vat_subject = true
    end
    @product_a = Shop::Product.create!(name: "Livre", unit_price: 25, vat_rate: "6", stock_quantity: 10)
    @product_b = Shop::Product.create!(name: "Jeu", unit_price: 15, vat_rate: "6", stock_quantity: 5)
  end

  test "creating a sale decrements stock and generates a Revenue" do
    sale = Shop::Sale.create!(
      sold_at: Date.current,
      organization: @organization,
      payment_method: "cash",
      items_attributes: [
        { shop_product_id: @product_a.id, quantity: 2, unit_price: 25, vat_rate: "6" },
        { shop_product_id: @product_b.id, quantity: 1, unit_price: 15, vat_rate: "6" }
      ]
    )

    assert_equal 8, @product_a.reload.stock_quantity
    assert_equal 4, @product_b.reload.stock_quantity

    assert sale.revenue.present?
    assert_equal 65.0, sale.revenue.amount.to_f
    assert_equal "received", sale.revenue.status
    assert_equal "shop", sale.revenue.pole
    assert_equal sale, sale.revenue.projectable
  end

  test "destroying a sale restores stock and destroys the Revenue" do
    sale = Shop::Sale.create!(
      sold_at: Date.current,
      organization: @organization,
      payment_method: "cash",
      items_attributes: [{ shop_product_id: @product_a.id, quantity: 3, unit_price: 25, vat_rate: "6" }]
    )

    assert_equal 7, @product_a.reload.stock_quantity
    revenue_id = sale.revenue_id

    sale.destroy!

    assert_equal 10, @product_a.reload.stock_quantity
    assert_nil Revenue.find_by(id: revenue_id)
  end

  test "exempt organization forces vat_rate exempt on generated Revenue" do
    pepi = Organization.find_or_create_by!(name: "Pepi Test") { |o| o.vat_subject = false }
    sale = Shop::Sale.create!(
      sold_at: Date.current,
      organization: pepi,
      payment_method: "cash",
      items_attributes: [{ shop_product_id: @product_a.id, quantity: 1, unit_price: 25, vat_rate: "6" }]
    )

    assert_equal "exempt", sale.revenue.vat_rate
    assert_equal 25.0, sale.revenue.amount.to_f
    assert_equal 25.0, sale.revenue.amount_excl_vat.to_f
    assert_equal 0.0, sale.revenue.vat_6.to_f
    assert sale.revenue.vat_exemption
  end

  test "sale without items is invalid" do
    sale = Shop::Sale.new(
      sold_at: Date.current,
      organization: @organization,
      payment_method: "cash"
    )
    assert_not sale.valid?
  end

  test "label reflects items" do
    sale = Shop::Sale.create!(
      sold_at: Date.current,
      organization: @organization,
      payment_method: "cash",
      items_attributes: [
        { shop_product_id: @product_a.id, quantity: 1, unit_price: 25, vat_rate: "6" },
        { shop_product_id: @product_b.id, quantity: 2, unit_price: 15, vat_rate: "6" }
      ]
    )

    assert_match(/Vente comptoir/, sale.label)
    assert_match(/Livre/, sale.label)
  end
end
