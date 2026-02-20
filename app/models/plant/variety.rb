module Plant
  class Variety < ApplicationRecord
    self.table_name = 'plant_varieties'

    belongs_to :species, class_name: 'Plant::Species'

    validates :latin_name, presence: true
    validates :taste_rating, inclusion: { in: 1..5 }, allow_nil: true
  end
end
