class CreateExpenseProjectAllocations < ActiveRecord::Migration[8.1]
  def change
    create_table :expense_project_allocations do |t|
      t.references :expense, null: false, foreign_key: true
      t.references :projectable, polymorphic: true, null: false
      t.decimal :amount, precision: 12, scale: 2, null: false, default: 0
      t.text :notes, default: "", null: false
      t.timestamps
    end
  end
end
