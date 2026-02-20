class AddTopicToAcademyTrainingSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_training_sessions, :topic, :string
  end
end
