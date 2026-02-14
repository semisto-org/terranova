module Plant
  class Genus < ApplicationRecord
    self.table_name = 'plant_genera'

    has_many :species, class_name: 'Plant::Species', foreign_key: :genus_id, dependent: :nullify

    validates :latin_name, presence: true
  end
end
