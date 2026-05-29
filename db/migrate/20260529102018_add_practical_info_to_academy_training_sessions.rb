class AddPracticalInfoToAcademyTrainingSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_training_sessions, :meeting_point, :string, default: "", null: false
    add_column :academy_training_sessions, :meeting_time, :string, default: "", null: false
    add_column :academy_training_sessions, :meals_info, :text, default: "", null: false
    add_column :academy_training_sessions, :accommodation_info, :text, default: "", null: false
    add_column :academy_training_sessions, :packing_list, :jsonb, default: [], null: false
  end
end
