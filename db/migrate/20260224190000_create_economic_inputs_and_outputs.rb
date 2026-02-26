class CreateEconomicInputsAndOutputs < ActiveRecord::Migration[8.0]
  def change
    create_table :economic_inputs do |t|
      t.date :date, null: false
      t.string :category, null: false
      t.integer :amount_cents, null: false, default: 0
      t.decimal :quantity, precision: 10, scale: 2, null: false, default: 0
      t.string :unit, null: false
      t.text :notes
      t.references :location, foreign_key: true
      t.references :zone, foreign_key: { to_table: :location_zones }
      t.references :design_project, foreign_key: { to_table: :design_projects }

      t.timestamps
    end

    add_index :economic_inputs, :date
    add_index :economic_inputs, :category

    create_table :economic_outputs do |t|
      t.date :date, null: false
      t.string :category, null: false
      t.integer :amount_cents
      t.decimal :quantity, precision: 10, scale: 2, null: false, default: 0
      t.string :unit, null: false
      t.string :species_name
      t.text :notes
      t.references :location, foreign_key: true
      t.references :zone, foreign_key: { to_table: :location_zones }
      t.references :design_project, foreign_key: { to_table: :design_projects }

      t.timestamps
    end

    add_index :economic_outputs, :date
    add_index :economic_outputs, :category
  end
end
