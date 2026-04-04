class AddCityAndBioToContacts < ActiveRecord::Migration[8.1]
  def change
    add_column :contacts, :city, :string, default: "", null: false
    add_column :contacts, :bio, :text, default: "", null: false
  end
end
