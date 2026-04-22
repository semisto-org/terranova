# frozen_string_literal: true

require "test_helper"

class Shop::ProductTest < ActiveSupport::TestCase
  test "valid with name and default values" do
    product = Shop::Product.new(name: "Test livre")
    assert product.valid?
  end

  test "requires name" do
    product = Shop::Product.new
    assert_not product.valid?
    assert product.errors[:name].any?
  end

  test "vat_rate inclusion" do
    product = Shop::Product.new(name: "x", vat_rate: "99")
    assert_not product.valid?
    assert product.errors[:vat_rate].any?
  end

  test "stock_quantity must be non-negative" do
    product = Shop::Product.new(name: "x", stock_quantity: -1)
    assert_not product.valid?
  end

  test "active and archive scopes" do
    a = Shop::Product.create!(name: "Active", stock_quantity: 5)
    b = Shop::Product.create!(name: "Arch", stock_quantity: 0, archived_at: Time.current)

    assert_includes Shop::Product.active.to_a, a
    assert_not_includes Shop::Product.active.to_a, b
    assert_includes Shop::Product.archived.to_a, b
  end

  test "in_stock?" do
    p = Shop::Product.create!(name: "x", stock_quantity: 3)
    assert p.in_stock?
    p.update!(stock_quantity: 0)
    assert_not p.reload.in_stock?
  end
end
