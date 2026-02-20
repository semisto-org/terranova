# frozen_string_literal: true

class AddSupplierContactToExpenses < ActiveRecord::Migration[8.1]
  def change
    add_reference :expenses, :supplier_contact, null: true, foreign_key: { to_table: :contacts }
    change_column_null :expenses, :supplier, true
  end
end
