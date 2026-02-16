class AllowNullInvoiceDateForPlannedExpenses < ActiveRecord::Migration[8.1]
  def change
    change_column_null :expenses, :invoice_date, true
  end
end
