class AddFeedbackRequestedAtToAcademyTrainingSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_training_sessions, :feedback_requested_at, :datetime
  end
end
