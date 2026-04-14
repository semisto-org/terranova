class CreateExpenseNoteLines < ActiveRecord::Migration[8.1]
  def change
    create_table :expense_note_lines do |t|
      t.references :expense_note, null: false, foreign_key: true
      t.integer :position, null: false, default: 0
      t.string :label, null: false
      t.integer :unit_amount_cents, null: false, default: 0
      t.decimal :quantity, precision: 10, scale: 2, null: false, default: 1
      t.integer :line_total_cents, null: false, default: 0

      t.timestamps
    end
  end
end
