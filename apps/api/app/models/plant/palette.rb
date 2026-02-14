module Plant
  class Palette < ApplicationRecord
    self.table_name = 'plant_palettes'

    has_many :items, class_name: 'Plant::PaletteItem', foreign_key: :palette_id, dependent: :destroy

    validates :name, :created_by, presence: true
  end
end
