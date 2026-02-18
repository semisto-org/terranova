require 'test_helper'

class Nursery::OrderTest < ActiveSupport::TestCase
  setup do
    Nursery::OrderLine.delete_all
    Nursery::Order.delete_all
    Nursery::Nursery.delete_all

    @nursery = Nursery::Nursery.create!(
      name: 'Test Nursery', nursery_type: 'semisto', integration: 'platform',
      city: 'LLN', postal_code: '1348', country: 'Belgique'
    )
  end

  test 'valid order' do
    order = Nursery::Order.new(
      order_number: 'PEP-2026-0001', customer_name: 'Jean Dupont',
      customer_email: 'jean@example.com', status: 'new',
      price_level: 'standard', pickup_nursery: @nursery
    )
    assert order.valid?
  end

  test 'validates status inclusion' do
    order = Nursery::Order.new(
      order_number: 'PEP-2026-0002', customer_name: 'Jean',
      status: 'invalid', price_level: 'standard', pickup_nursery: @nursery
    )
    assert_not order.valid?
    assert_includes order.errors[:status], 'is not included in the list'
  end

  test 'validates price_level inclusion' do
    order = Nursery::Order.new(
      order_number: 'PEP-2026-0003', customer_name: 'Jean',
      status: 'new', price_level: 'free', pickup_nursery: @nursery
    )
    assert_not order.valid?
    assert_includes order.errors[:price_level], 'is not included in the list'
  end

  test 'has many lines and transfers' do
    order = Nursery::Order.create!(
      order_number: 'PEP-2026-0004', customer_name: 'Jean',
      customer_email: 'j@example.com', status: 'new',
      price_level: 'standard', pickup_nursery: @nursery
    )
    assert_respond_to order, :lines
    assert_respond_to order, :transfers
  end
end
