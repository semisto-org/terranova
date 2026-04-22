class CreateBankMatchingRules < ActiveRecord::Migration[8.1]
  def change
    create_table :bank_matching_rules do |t|
      t.references :organization, foreign_key: true, null: true
      t.string :pattern_field, null: false # counterpart_name | remittance_info | counterpart_iban
      t.string :pattern_value, null: false
      t.references :suggested_supplier_contact, foreign_key: { to_table: :contacts }, null: true
      t.references :suggested_expense_category, foreign_key: { to_table: :expense_categories }, null: true
      t.string :suggested_expense_type
      t.string :suggested_vat_rate
      t.text :notes, default: "", null: false
      t.references :created_by, foreign_key: { to_table: :members }, null: true
      t.datetime :last_applied_at
      t.integer :applied_count, default: 0, null: false
      t.timestamps
    end

    add_index :bank_matching_rules, [:pattern_field, :pattern_value]
  end
end
