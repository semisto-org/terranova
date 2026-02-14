module Design
  class SiteAnalysis < ApplicationRecord
    self.table_name = 'design_site_analyses'

    belongs_to :project, class_name: 'Design::Project'

    validates :project_id, presence: true
  end
end
