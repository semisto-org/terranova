module Design
  class ProjectDocument < ApplicationRecord
    include SoftDeletable
    self.table_name = 'design_project_documents'

    belongs_to :project, class_name: 'Design::Project', optional: true

    validates :category, :name, :url, :uploaded_at, presence: true
  end
end
