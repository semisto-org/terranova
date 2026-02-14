module Design
  class ProjectDocument < ApplicationRecord
    self.table_name = 'design_project_documents'

    belongs_to :project, class_name: 'Design::Project'

    validates :category, :name, :url, :uploaded_at, presence: true
  end
end
