# frozen_string_literal: true

class AddPhotoAlbumUrlToAcademyTrainingSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_training_sessions, :photo_album_url, :string, default: "", null: false
  end
end
