class AddVisibleInDirectoryToContacts < ActiveRecord::Migration[8.1]
  def change
    add_column :contacts, :visible_in_directory, :boolean, default: false, null: false
  end
end
