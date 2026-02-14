module Design
  class ProjectMeeting < ApplicationRecord
    self.table_name = 'design_project_meetings'

    belongs_to :project, class_name: 'Design::Project'

    validates :title, :starts_at, presence: true
  end
end
