class AddContactDetailsToAcademyTrainingRegistrations < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_training_registrations, :phone, :string, default: "", null: false
    add_column :academy_training_registrations, :departure_postal_code, :string, default: "", null: false
    add_column :academy_training_registrations, :departure_country, :string, default: "", null: false
  end
end
