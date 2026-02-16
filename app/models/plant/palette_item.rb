module Plant
  class PaletteItem < ApplicationRecord
    include SoftDeletable
    self.table_name = 'plant_palette_items'

    belongs_to :palette, class_name: 'Plant::Palette'

    validates :item_type, :item_id, :strate_key, presence: true
  end
end
