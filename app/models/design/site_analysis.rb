module Design
  class SiteAnalysis < ApplicationRecord
    self.table_name = 'design_site_analyses'

    ZONING_CATEGORIES = [
      'zone_agricole',
      'zone_habitat',
      'zone_forestiere',
      'zone_naturelle',
      'zone_mixte',
      'autre'
    ].freeze

    belongs_to :project, class_name: 'Design::Project'

    before_validation :normalize_zoning_categories

    validates :project_id, presence: true
    validate :zoning_categories_are_supported

    private

    def normalize_zoning_categories
      self.zoning_categories = Array(zoning_categories).map(&:to_s).reject(&:blank?).uniq
    end

    def zoning_categories_are_supported
      unsupported = Array(zoning_categories).map(&:to_s) - ZONING_CATEGORIES
      return if unsupported.empty?

      errors.add(:zoning_categories, "contains unsupported values: #{unsupported.join(', ')}")
    end
  end
end
