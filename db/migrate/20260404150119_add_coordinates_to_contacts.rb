class AddCoordinatesToContacts < ActiveRecord::Migration[8.1]
  def change
    add_column :contacts, :latitude, :decimal, precision: 10, scale: 6
    add_column :contacts, :longitude, :decimal, precision: 10, scale: 6
  end
end
