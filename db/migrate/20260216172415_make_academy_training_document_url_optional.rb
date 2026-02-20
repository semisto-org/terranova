class MakeAcademyTrainingDocumentUrlOptional < ActiveRecord::Migration[8.1]
  def change
    change_column_null :academy_training_documents, :url, true
  end
end
