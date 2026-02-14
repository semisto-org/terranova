class AddCoordinatesToAcademyTrainingLocations < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_training_locations, :latitude, :decimal, precision: 10, scale: 6, default: 0.0, null: false
    add_column :academy_training_locations, :longitude, :decimal, precision: 10, scale: 6, default: 0.0, null: false
  end
end
