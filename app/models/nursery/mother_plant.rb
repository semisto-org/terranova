module Nursery
  class MotherPlant < ApplicationRecord
    self.table_name = 'nursery_mother_plants'

    SOURCES = %w[design-studio member-proposal].freeze
    STATUSES = %w[pending validated rejected].freeze

    validates :species_id, :species_name, :source, :status, :planting_date, presence: true
    validates :source, inclusion: { in: SOURCES }
    validates :status, inclusion: { in: STATUSES }
  end
end
