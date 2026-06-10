class AddPhotoConsentToAcademyTrainingRegistrations < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_training_registrations, :photo_consent, :boolean, null: false, default: true
  end
end
