module Plant
  class Species < ApplicationRecord
    self.table_name = 'plant_species'

    belongs_to :genus, class_name: 'Plant::Genus', optional: true
    has_many :varieties, class_name: 'Plant::Variety', foreign_key: :species_id, dependent: :destroy

    validates :latin_name, :plant_type, presence: true
  end
end
