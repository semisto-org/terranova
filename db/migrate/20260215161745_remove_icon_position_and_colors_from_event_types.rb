class RemoveIconPositionAndColorsFromEventTypes < ActiveRecord::Migration[8.1]
  def up
    remove_column :event_types, :icon, :string
    remove_column :event_types, :position, :integer
    remove_column :event_types, :color, :string
    remove_column :event_types, :bg_color, :string
    
    # Remove index on position if it exists
    remove_index :event_types, :position if index_exists?(:event_types, :position)
  end

  def down
    add_column :event_types, :icon, :string
    add_column :event_types, :position, :integer, default: 0
    add_column :event_types, :color, :string
    add_column :event_types, :bg_color, :string
    
    add_index :event_types, :position
  end
end
