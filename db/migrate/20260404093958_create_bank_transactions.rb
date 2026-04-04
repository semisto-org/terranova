# frozen_string_literal: true

class CreateBankTransactions < ActiveRecord::Migration[8.1]
  def change
    create_table :bank_transactions do |t|
      t.references :bank_connection, null: false, foreign_key: true
      t.string :provider_transaction_id, null: false
      t.date :date, null: false
      t.date :booking_date
      t.decimal :amount, precision: 12, scale: 2, null: false
      t.string :currency, null: false, default: "EUR"
      t.string :counterpart_name
      t.string :counterpart_iban
      t.text :remittance_info
      t.string :internal_reference
      t.string :category
      t.string :status, null: false, default: "unmatched"

      t.timestamps
    end

    add_index :bank_transactions, :provider_transaction_id, unique: true
    add_index :bank_transactions, :date
    add_index :bank_transactions, :status
    add_index :bank_transactions, [:bank_connection_id, :date]
  end
end
