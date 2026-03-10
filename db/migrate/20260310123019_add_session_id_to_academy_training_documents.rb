class AddSessionIdToAcademyTrainingDocuments < ActiveRecord::Migration[8.1]
  def change
    add_reference :academy_training_documents, :session,
      foreign_key: { to_table: :academy_training_sessions }, null: true
  end
end
