module Plant
  class Species < ApplicationRecord
    self.table_name = 'plant_species'

    GROWTH_HABITS = %w[
      arbustif-elance arbustif-arrondi
      buissonnant-elance buissonnant-arrondi
      grimpant tige touffe acaule tapissant
    ].freeze

    STRATES = %w[low medium shrub tree canopy vine aquatic subterranean].freeze
    SUCCESSIONAL_ROLES = %w[pioneer nurse climax].freeze

    ECO_SERVICES = %w[
      windbreak mellifere birds beneficial-insects erosion-control light-shade
      nitrogen ground-cover cross-pollination organic-matter minerals
      weed-suppression
    ].freeze

    RESOURCE_CATEGORIES = %w[edible aromatic medicinal fiber sensory animal].freeze

    PLANT_PARTS = %w[fruit flower leaf seed root bark sap stem].freeze

    SENSORY_SUBTYPES = %w[ornamental dye fragrant].freeze

    ANIMAL_SUBTYPES = %w[pecked browsed].freeze

    TOXICITY_TARGETS = %w[humans sheep dogs horses poultry cattle].freeze

    SPECIFIC_POLLINATORS = %w[bees bumblebees butterflies hoverflies beetles wind birds].freeze

    # Legacy attributes — deprecated since Phase E (Plant Cards, 2026-05-07).
    # The following columns are preserved for backwards compatibility but new
    # code should read/write the card fields instead. They were migrated by
    # `rake plants:migrate_legacy` (lib/tasks/plants_migrate_legacy.rake).
    #
    #   interests        → eco_services_provided + resource_parts (sensory/edible/animal/medicinal/aromatic)
    #   ecosystem_needs  → eco_services_needed
    #   edible_parts     → resource_parts['edible'] (FR labels translated to PLANT_PARTS keys)
    #   fragrance        → resource_parts['sensory'] (when light/medium/strong)
    #   fodder_qualities → resource_parts['animal'] (when present, → 'browsed')

    belongs_to :genus, class_name: 'Plant::Genus', optional: true
    has_many :varieties, class_name: 'Plant::Variety', foreign_key: :species_id, dependent: :destroy

    has_one_attached :silhouette_illustration

    validates :latin_name, :plant_type, presence: true
    validates :growth_habit, inclusion: { in: GROWTH_HABITS }, allow_nil: true
    validates :strate, inclusion: { in: STRATES }, allow_nil: true
    validates :successional_role, inclusion: { in: SUCCESSIONAL_ROLES }, allow_nil: true
    validates :edible_rating, inclusion: { in: 1..5 }, allow_nil: true
    validates :medicinal_rating, inclusion: { in: 1..5 }, allow_nil: true

    def slug
      latin_name.parameterize
    end
  end
end
