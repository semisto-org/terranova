class RemoveDocumentTypeFromAcademyTrainingDocuments < ActiveRecord::Migration[8.1]
  def change
    remove_column :academy_training_documents, :document_type, :string, null: false
  end
end
