class RemoveNameFromEventTypesAndMakeLabelUnique < ActiveRecord::Migration[8.1]
  def up
    # Remove unique index on name
    remove_index :event_types, :name if index_exists?(:event_types, :name)

    # Remove name column
    remove_column :event_types, :name, :string

    # Add unique index on label
    add_index :event_types, :label, unique: true
  end

  def down
    # Remove unique index on label
    remove_index :event_types, :label if index_exists?(:event_types, :label)

    # Add name column back
    add_column :event_types, :name, :string, null: false

    # Restore name from label (simple migration)
    EventType.reset_column_information
    EventType.find_each do |et|
      et.update_column(:name, et.label.parameterize.underscore)
    end

    # Add unique index on name
    add_index :event_types, :name, unique: true
  end
end
