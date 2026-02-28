class AddLaborTypeToEconomicInputs < ActiveRecord::Migration[8.0]
  def change
    add_column :economic_inputs, :labor_type, :string
    add_index :economic_inputs, :labor_type
  end
end
