# frozen_string_literal: true

class AddTrainerDocsRequestedAtToAcademyTrainingSessions < ActiveRecord::Migration[8.1]
  def up
    add_column :academy_training_sessions, :trainer_docs_requested_at, :datetime

    # Marque toutes les sessions DÉJÀ terminées comme « déjà notifiées » pour
    # qu'au premier passage du job, on n'envoie pas un email rétroactif aux
    # formateurs pour des sessions passées. Seules les sessions à venir
    # déclencheront un rappel.
    execute <<~SQL
      UPDATE academy_training_sessions
      SET trainer_docs_requested_at = NOW()
      WHERE end_date < CURRENT_DATE
    SQL
  end

  def down
    remove_column :academy_training_sessions, :trainer_docs_requested_at
  end
end
