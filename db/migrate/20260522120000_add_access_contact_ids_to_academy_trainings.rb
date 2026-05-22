# frozen_string_literal: true

class AddAccessContactIdsToAcademyTrainings < ActiveRecord::Migration[8.1]
  def change
    # Contact IDs (stored as strings, like trainer_ids/assistant_ids) explicitly
    # granted My Semisto access to this training without being registered participants.
    add_column :academy_trainings, :access_contact_ids, :jsonb, default: [], null: false
  end
end
