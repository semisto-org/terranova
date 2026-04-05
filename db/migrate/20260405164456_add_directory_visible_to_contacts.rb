class AddDirectoryVisibleToContacts < ActiveRecord::Migration[8.1]
  def change
    add_column :contacts, :directory_visible, :boolean, default: false, null: false
  end
end
