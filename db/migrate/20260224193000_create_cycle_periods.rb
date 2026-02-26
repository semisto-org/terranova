class CreateCyclePeriods < ActiveRecord::Migration[7.1]
  def change
    create_table :cycle_periods do |t|
      t.string :name, null: false
      t.date :starts_on, null: false
      t.date :ends_on, null: false
      t.date :cooldown_starts_on, null: false
      t.date :cooldown_ends_on, null: false
      t.string :color, null: false, default: "#5B5781"
      t.text :notes
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :cycle_periods, :starts_on
    add_index :cycle_periods, :active
  end
end
