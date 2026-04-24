class RenamePoleProjectDocumentsToProjectDocuments < ActiveRecord::Migration[8.1]
  def up
    execute(<<~SQL)
      UPDATE active_storage_attachments
      SET name = 'project_documents'
      WHERE record_type = 'PoleProject' AND name = 'documents';
    SQL
  end

  def down
    execute(<<~SQL)
      UPDATE active_storage_attachments
      SET name = 'documents'
      WHERE record_type = 'PoleProject' AND name = 'project_documents';
    SQL
  end
end
