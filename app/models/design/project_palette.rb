module Design
  class ProjectPalette < ApplicationRecord
    self.table_name = 'design_project_palettes'

    belongs_to :project, class_name: 'Design::Project'
    has_many :items, class_name: 'Design::ProjectPaletteItem', foreign_key: :palette_id, dependent: :destroy
  end
end
