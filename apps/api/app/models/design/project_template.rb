module Design
  class ProjectTemplate < ApplicationRecord
    self.table_name = 'design_project_templates'

    has_many :projects, class_name: 'Design::Project', foreign_key: :template_id, dependent: :nullify

    validates :name, presence: true
  end
end
