# frozen_string_literal: true

module Cash
  # Keeps the virtual cash BankConnection in sync with shop sales and expenses
  # whose payment_method / payment_type is "cash". Each cash-paid record gets
  # a matching BankTransaction (+ for revenues, − for expenses) and a
  # BankReconciliation that links the two together.
  class Bookkeeper
    # Called when a Shop::Sale is created/updated with payment_method=cash
    def self.record_shop_sale(sale)
      return unless sale.payment_method == "cash"
      return unless sale.revenue # Revenue is created by RevenueGenerator in after_create

      organization = sale.organization
      cash = organization.cash_account
      return unless cash

      tx_ref = "cash_shop_sale_#{sale.id}"
      tx = BankTransaction.find_or_initialize_by(provider_transaction_id: tx_ref)
      tx.assign_attributes(
        bank_connection: cash,
        date: sale.sold_at,
        booking_date: sale.sold_at,
        amount: sale.total_amount,
        currency: "EUR",
        counterpart_name: sale.contact&.name || sale.customer_label.presence || "Vente comptoir",
        remittance_info: sale.label,
        status: "matched"
      )
      tx.save!

      # Link to Revenue via BankReconciliation (idempotent)
      BankReconciliation.find_or_create_by!(bank_transaction: tx) do |r|
        r.reconcilable = sale.revenue
        r.amount = sale.total_amount
        r.confidence = "auto"
      end
    end

    def self.unrecord_shop_sale(sale)
      BankTransaction.where(provider_transaction_id: "cash_shop_sale_#{sale.id}").destroy_all
    end

    def self.record_expense(expense)
      return unless expense.payment_type == "cash"

      organization = expense.organization
      cash = organization.cash_account
      return unless cash

      tx_ref = "cash_expense_#{expense.id}"
      tx = BankTransaction.find_or_initialize_by(provider_transaction_id: tx_ref)
      tx.assign_attributes(
        bank_connection: cash,
        date: expense.payment_date || expense.invoice_date || Date.current,
        booking_date: expense.payment_date || expense.invoice_date || Date.current,
        amount: -expense.total_incl_vat.to_f,
        currency: "EUR",
        counterpart_name: expense.supplier_display_name,
        remittance_info: expense.name.to_s,
        status: "matched"
      )
      tx.save!

      BankReconciliation.find_or_create_by!(bank_transaction: tx) do |r|
        r.reconcilable = expense
        r.amount = expense.total_incl_vat.to_f
        r.confidence = "auto"
      end
    end

    def self.unrecord_expense(expense)
      BankTransaction.where(provider_transaction_id: "cash_expense_#{expense.id}").destroy_all
    end

    # Records a cash-to-bank transfer: Michael takes cash out of the register
    # and wires the equivalent from his personal account to the organization's
    # bank. Creates two BankTransactions: a debit on the cash account, and a
    # pending credit on the bank account (matched to the cash movement).
    def self.record_cash_transfer(organization:, amount:, date:, note: nil, bank_connection: nil)
      raise ArgumentError, "amount must be positive" unless amount.to_f.positive?

      cash = organization.cash_account
      raise "No cash account for organization #{organization.id}" unless cash

      target_bank = bank_connection || organization.bank_connections.real_accounts.active.first
      raise "No real bank connection available for organization #{organization.id}" unless target_bank

      ref_base = "cash_transfer_#{SecureRandom.hex(6)}"

      cash_tx = nil
      bank_tx = nil
      description = note.presence || "Apport de caisse vers #{target_bank.bank_name}"

      BankConnection.transaction do
        cash_tx = BankTransaction.create!(
          bank_connection: cash,
          provider_transaction_id: "#{ref_base}_cash",
          date: date,
          booking_date: date,
          amount: -amount.to_f,
          currency: "EUR",
          counterpart_name: "Apport vers #{target_bank.bank_name}",
          remittance_info: description,
          status: "matched"
        )

        bank_tx = BankTransaction.create!(
          bank_connection: target_bank,
          provider_transaction_id: "#{ref_base}_bank",
          date: date,
          booking_date: date,
          amount: amount.to_f,
          currency: "EUR",
          counterpart_name: "Apport depuis caisse",
          remittance_info: description,
          status: "unmatched"
        )
      end

      { cash_transaction: cash_tx, bank_transaction: bank_tx }
    end
  end
end
