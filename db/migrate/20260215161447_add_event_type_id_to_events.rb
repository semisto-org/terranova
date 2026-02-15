class AddEventTypeIdToEvents < ActiveRecord::Migration[8.1]
  def up
    # Add event_type_id column (nullable initially for data migration)
    add_reference :events, :event_type, null: true, foreign_key: true

    # Migrate existing data: associate events with EventType by name
    Event.reset_column_information
    Event.find_each do |event|
      event_type = EventType.find_by(name: event.read_attribute(:event_type))
      if event_type
        event.update_column(:event_type_id, event_type.id)
      else
        # Fallback: create a default event type if missing
        default_type = EventType.find_or_create_by!(name: event.read_attribute(:event_type)) do |et|
          et.label = event.read_attribute(:event_type).humanize
          et.icon = '📅'
          et.color = 'text-stone-700 dark:text-stone-300'
          et.bg_color = 'bg-stone-100 dark:bg-stone-700'
          et.position = 999
        end
        event.update_column(:event_type_id, default_type.id)
      end
    end

    # Make event_type_id required
    change_column_null :events, :event_type_id, false

    # Remove old event_type string column
    remove_column :events, :event_type, :string
  end

  def down
    # Add back event_type string column
    add_column :events, :event_type, :string, null: false

    # Migrate data back: get name from EventType
    Event.reset_column_information
    Event.find_each do |event|
      event.update_column(:event_type, event.event_type.name) if event.event_type
    end

    # Remove foreign key and event_type_id
    remove_reference :events, :event_type, foreign_key: true
  end
end
