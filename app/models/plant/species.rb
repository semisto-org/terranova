module Plant
  class Species < ApplicationRecord
    self.table_name = 'plant_species'

    GROWTH_HABITS = %w[
      arbustif-elance arbustif-arrondi
      buissonnant-elance buissonnant-arrondi
      grimpant tige touffe acaule tapissant
    ].freeze

    belongs_to :genus, class_name: 'Plant::Genus', optional: true
    has_many :varieties, class_name: 'Plant::Variety', foreign_key: :species_id, dependent: :destroy

    validates :latin_name, :plant_type, presence: true
    validates :growth_habit, inclusion: { in: GROWTH_HABITS }, allow_nil: true
    validates :edible_rating, inclusion: { in: 1..5 }, allow_nil: true
    validates :medicinal_rating, inclusion: { in: 1..5 }, allow_nil: true
  end
end
