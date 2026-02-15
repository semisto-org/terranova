class CreateEventTypes < ActiveRecord::Migration[8.1]
  def change
    create_table :event_types do |t|
      t.string :name, null: false
      t.string :label, null: false
      t.string :icon, null: false
      t.string :color, null: false
      t.string :bg_color, null: false
      t.integer :position, default: 0, null: false

      t.timestamps
    end

    add_index :event_types, :name, unique: true
    add_index :event_types, :position
  end
end
