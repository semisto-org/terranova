module Design
  class PlantMarker < ApplicationRecord
    include SoftDeletable
    self.table_name = 'design_plant_markers'

    belongs_to :planting_plan, class_name: 'Design::PlantingPlan'
    belongs_to :palette_item, class_name: 'Design::ProjectPaletteItem', optional: true
    has_many :plant_records, class_name: 'Design::PlantRecord', foreign_key: :marker_id, dependent: :nullify

    validates :number, :species_name, presence: true
  end
end
