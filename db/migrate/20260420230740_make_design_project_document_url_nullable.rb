class MakeDesignProjectDocumentUrlNullable < ActiveRecord::Migration[8.1]
  def up
    change_column_null :design_project_documents, :url, true
  end

  def down
    change_column_null :design_project_documents, :url, false
  end
end
