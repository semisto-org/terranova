module Design
  class ProjectPaletteItem < ApplicationRecord
    include SoftDeletable
    self.table_name = 'design_project_palette_items'

    LAYERS = %w[canopy sub-canopy shrub herbaceous ground-cover vine root].freeze

    belongs_to :palette, class_name: 'Design::ProjectPalette'

    validates :species_id, :species_name, :layer, presence: true
    validates :layer, inclusion: { in: LAYERS }
  end
end
