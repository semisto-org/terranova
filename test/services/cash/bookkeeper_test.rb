# frozen_string_literal: true

require "test_helper"

class Cash::BookkeeperTest < ActiveSupport::TestCase
  setup do
    @organization = Organization.find_or_create_by!(name: "Bookkeeper Test Org") do |o|
      o.is_default = true
      o.vat_subject = true
    end
    @organization.ensure_cash_account!
    @cash = @organization.reload.cash_account
  end

  test "shop sale with cash payment increments cash balance" do
    product = Shop::Product.create!(name: "Livre test", unit_price: 25, vat_rate: "6", stock_quantity: 5)
    sale = Shop::Sale.create!(
      sold_at: Date.current, organization: @organization, payment_method: "cash",
      items_attributes: [{ shop_product_id: product.id, quantity: 1, unit_price: 25, vat_rate: "6" }]
    )

    assert_equal 25.0, @cash.reload.balance
    assert_equal 1, @cash.bank_transactions.where(provider_transaction_id: "cash_shop_sale_#{sale.id}").count

    # Reconciliation linked to the Revenue
    tx = @cash.bank_transactions.find_by(provider_transaction_id: "cash_shop_sale_#{sale.id}")
    assert_equal sale.revenue, tx.bank_reconciliations.first.reconcilable
  end

  test "destroying a cash sale restores the balance" do
    product = Shop::Product.create!(name: "Livre test", unit_price: 30, vat_rate: "6", stock_quantity: 5)
    sale = Shop::Sale.create!(
      sold_at: Date.current, organization: @organization, payment_method: "cash",
      items_attributes: [{ shop_product_id: product.id, quantity: 1, unit_price: 30, vat_rate: "6" }]
    )
    assert_equal 30.0, @cash.reload.balance

    sale.destroy!
    assert_equal 0.0, @cash.reload.balance
  end

  test "transfer payment method does not touch cash" do
    product = Shop::Product.create!(name: "X", unit_price: 50, vat_rate: "6", stock_quantity: 2)
    Shop::Sale.create!(
      sold_at: Date.current, organization: @organization, payment_method: "transfer",
      items_attributes: [{ shop_product_id: product.id, quantity: 1, unit_price: 50, vat_rate: "6" }]
    )
    assert_equal 0.0, @cash.reload.balance
  end

  test "expense with cash payment_type debits cash" do
    expense = Expense.create!(
      name: "Achat marché", supplier: "Marché", status: "paid",
      expense_type: "services_and_goods", invoice_date: Date.current,
      total_incl_vat: 12.50, amount_excl_vat: 11.79,
      payment_type: "cash", payment_date: Date.current, organization: @organization
    )
    assert_equal(-12.50, @cash.reload.balance)

    expense.destroy!
    assert_equal 0.0, @cash.reload.balance
  end

  test "record_cash_transfer creates two linked transactions" do
    # Pre-fill cash so transfer can succeed
    product = Shop::Product.create!(name: "Y", unit_price: 100, vat_rate: "6", stock_quantity: 1)
    Shop::Sale.create!(
      sold_at: Date.current, organization: @organization, payment_method: "cash",
      items_attributes: [{ shop_product_id: product.id, quantity: 1, unit_price: 100, vat_rate: "6" }]
    )
    assert_equal 100.0, @cash.reload.balance

    # Need a real bank connection for the target
    bank = BankConnection.create!(
      provider: "coda_import", bank_name: "Triodos Test",
      status: "linked", accounting_scope: "general",
      organization: @organization, connected_by: Member.where(is_admin: true).first
    )

    result = Cash::Bookkeeper.record_cash_transfer(
      organization: @organization, amount: 80.0, date: Date.current, note: "Test transfer"
    )

    assert_equal(-80.0, result[:cash_transaction].amount.to_f)
    assert_equal 80.0, result[:bank_transaction].amount.to_f
    assert_equal "matched", result[:cash_transaction].status
    assert_equal "unmatched", result[:bank_transaction].status

    # Cash balance is now 20€ (100 - 80)
    assert_equal 20.0, @cash.reload.balance
  end
end
