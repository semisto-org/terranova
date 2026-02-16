class RenameDescriptionToNameOnExpenses < ActiveRecord::Migration[8.1]
  def change
    rename_column :expenses, :description, :name
  end
end
