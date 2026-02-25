class AddDesignReportingIndexes < ActiveRecord::Migration[7.1]
  def change
    add_index :revenues, :date unless index_exists?(:revenues, :date)
    add_index :expenses, :invoice_date unless index_exists?(:expenses, :invoice_date)

    add_index :revenues, [:design_project_id, :date], name: "idx_revenues_design_project_date" unless index_exists?(:revenues, [:design_project_id, :date], name: "idx_revenues_design_project_date")
    add_index :expenses, [:design_project_id, :invoice_date], name: "idx_expenses_design_project_invoice_date" unless index_exists?(:expenses, [:design_project_id, :invoice_date], name: "idx_expenses_design_project_invoice_date")
    add_index :timesheets, [:design_project_id, :date], name: "idx_timesheets_design_project_date" unless index_exists?(:timesheets, [:design_project_id, :date], name: "idx_timesheets_design_project_date")
  end
end
