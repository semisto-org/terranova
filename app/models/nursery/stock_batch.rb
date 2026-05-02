module Nursery
  class StockBatch < ApplicationRecord
    include SoftDeletable
    self.table_name = 'nursery_stock_batches'

    GROWTH_STAGES = %w[seed seedling young established mature].freeze
    STATUSES = %w[available in_production sold_out archived].freeze

    belongs_to :nursery, class_name: 'Nursery::Nursery'
    belongs_to :container, class_name: 'Nursery::Container'
    belongs_to :species, class_name: 'Plant::Species'
    belongs_to :variety, class_name: 'Plant::Variety', optional: true
    has_many :order_lines, class_name: 'Nursery::OrderLine', foreign_key: :stock_batch_id, dependent: :restrict_with_error

    validates :growth_stage, presence: true, inclusion: { in: GROWTH_STAGES }
    validates :status, presence: true, inclusion: { in: STATUSES }
    validate :expected_availability_required_for_in_production

    before_validation :sync_denormalized_names

    private

    def sync_denormalized_names
      self.species_name = species.latin_name if species
      self.variety_name = variety ? variety.latin_name : ''
    end

    def expected_availability_required_for_in_production
      return unless status == 'in_production'
      return if expected_availability_on.present? || availability_label.to_s.strip.present?

      errors.add(:expected_availability_on, 'doit être renseignée quand le lot est en production (ou utiliser un libellé)')
    end
  end
end
