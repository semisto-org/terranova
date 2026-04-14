class CreateExpenseNotes < ActiveRecord::Migration[8.1]
  def change
    create_table :expense_notes do |t|
      t.string :number, null: false
      t.string :subject, null: false
      t.date :note_date, null: false
      t.string :status, null: false, default: "draft"
      t.references :contact, null: false, foreign_key: true
      t.references :organization, null: false, foreign_key: true
      t.text :notes
      t.integer :total_cents, null: false, default: 0
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :expense_notes, :number, unique: true
    add_index :expense_notes, :status
    add_index :expense_notes, :deleted_at
  end
end
