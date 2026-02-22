class MakeProjectIdOptionalOnQuotesAndDocuments < ActiveRecord::Migration[8.0]
  def change
    change_column_null :design_quotes, :project_id, true
    change_column_null :design_project_documents, :project_id, true
  end
end
