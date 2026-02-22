class ChangeContactIdOnRegistrationsToFk < ActiveRecord::Migration[8.0]
  def up
    # Remove the old string contact_id column
    remove_column :academy_training_registrations, :contact_id

    # Add a proper FK reference to contacts
    add_reference :academy_training_registrations, :contact, null: true, foreign_key: true
  end

  def down
    remove_reference :academy_training_registrations, :contact, foreign_key: true
    add_column :academy_training_registrations, :contact_id, :string, default: "", null: false
  end
end
