# frozen_string_literal: true

class CreateBankReconciliations < ActiveRecord::Migration[8.1]
  def change
    create_table :bank_reconciliations do |t|
      t.references :bank_transaction, null: false, foreign_key: true
      t.string :reconcilable_type, null: false
      t.bigint :reconcilable_id, null: false
      t.string :confidence, null: false, default: "manual"
      t.bigint :matched_by_id
      t.text :notes

      t.timestamps
    end

    add_index :bank_reconciliations, :bank_transaction_id, unique: true
    add_index :bank_reconciliations, [:reconcilable_type, :reconcilable_id], name: "idx_bank_reconciliations_on_reconcilable"
    add_foreign_key :bank_reconciliations, :members, column: :matched_by_id
  end
end
