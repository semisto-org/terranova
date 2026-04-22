class SupportSplitBankReconciliations < ActiveRecord::Migration[8.1]
  def up
    add_column :bank_reconciliations, :amount, :decimal, precision: 12, scale: 2

    execute <<~SQL
      UPDATE bank_reconciliations br
      SET amount = ABS(bt.amount)
      FROM bank_transactions bt
      WHERE br.bank_transaction_id = bt.id
    SQL

    change_column_null :bank_reconciliations, :amount, false
    change_column_default :bank_reconciliations, :amount, from: nil, to: 0

    remove_index :bank_reconciliations, name: "index_bank_reconciliations_on_bank_transaction_id"
    add_index :bank_reconciliations, :bank_transaction_id
  end

  def down
    add_index :bank_reconciliations, :bank_transaction_id, unique: true, name: "index_bank_reconciliations_on_bank_transaction_id"
    remove_column :bank_reconciliations, :amount
  end
end
