class AddShareParticipantDirectoryToAcademyTrainings < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_trainings, :share_participant_directory, :boolean, default: false, null: false
  end
end
