module Design
  class PlantRecord < ApplicationRecord
    self.table_name = 'design_plant_records'

    STATUSES = %w[alive dead to-replace replaced].freeze

    belongs_to :project, class_name: 'Design::Project'
    belongs_to :marker, class_name: 'Design::PlantMarker', optional: true
    belongs_to :palette_item, class_name: 'Design::ProjectPaletteItem', optional: true

    validates :status, inclusion: { in: STATUSES }
  end
end
