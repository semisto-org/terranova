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

    SECTION_CORE_FIELDS = {
      climate: %w[temperature rain wind sun exposure_constraints],
      geomorphology: %w[topography slope orientation relief constraints],
      water: %w[network rainwater runoff flood_risk drainage],
      biodiversity: %w[existing_flora existing_fauna habitats ecological_pressures],
      socio_economic: %w[neighbors uses nuisances opportunities regulations],
      access: %w[road_access pedestrian_access logistics parking constraints],
      microclimate: %w[heat_islands wind_corridors shade frost_pockets],
      built_environment: %w[adjacent_buildings heritage networks constraints],
      zoning: %w[categories prescriptions opportunities constraints],
      soil: %w[texture structure ph organic_matter contamination],
      aesthetics: %w[views identity materials ambience references]
    }.freeze

    belongs_to :project, class_name: 'Design::Project'

    before_validation :normalize_analysis_payloads

    validates :project_id, presence: true
    validate :zoning_categories_are_supported
    validate :analysis_sections_must_be_objects

    def biodiversity
      vegetation || {}
    end

    def built_environment
      buildings || {}
    end

    def access
      access_data || {}
    end

    def zoning
      read_attribute(:zoning) || {}
    end

    def aesthetics
      read_attribute(:aesthetics) || {}
    end

    def zoning_categories_list
      categories = Array(zoning['categories'])
      categories = Array(zoning_categories) if categories.empty?
      categories.map(&:to_s).reject(&:blank?).uniq
    end

    private

    def normalize_analysis_payloads
      self.climate = normalize_section_hash(climate, :climate)
      self.geomorphology = normalize_section_hash(geomorphology, :geomorphology)
      self.water = normalize_section_hash(water, :water)
      self.vegetation = normalize_section_hash(vegetation, :biodiversity)
      self.socio_economic = normalize_section_hash(socio_economic, :socio_economic)
      self.access_data = normalize_section_hash(access_data, :access)
      self.microclimate = normalize_section_hash(microclimate, :microclimate)
      self.buildings = normalize_section_hash(buildings, :built_environment)
      self.soil = normalize_section_hash(soil, :soil)
      self.zoning = normalize_section_hash(read_attribute(:zoning), :zoning)
      self.aesthetics = normalize_section_hash(read_attribute(:aesthetics), :aesthetics)

      normalized_categories = zoning_categories_list
      self.zoning_categories = normalized_categories
      self.zoning = zoning.merge('categories' => normalized_categories)
    end

    def normalize_section_hash(raw_value, section)
      hash = raw_value.is_a?(Hash) ? raw_value.deep_stringify_keys : {}

      SECTION_CORE_FIELDS.fetch(section, []).each do |field|
        if section == :zoning && field == 'categories'
          hash[field] = Array(hash[field]).map(&:to_s).reject(&:blank?).uniq
        else
          hash[field] = normalize_value_note(hash[field])
        end
      end

      hash
    end

    def normalize_value_note(value)
      source = value.is_a?(Hash) ? value.deep_stringify_keys : {}
      {
        'value' => source['value'],
        'note' => source['note'].to_s
      }
    end

    def zoning_categories_are_supported
      unsupported = zoning_categories_list - ZONING_CATEGORIES
      return if unsupported.empty?

      errors.add(:zoning_categories, "contains unsupported values: #{unsupported.join(', ')}")
    end

    def analysis_sections_must_be_objects
      {
        climate: climate,
        geomorphology: geomorphology,
        water: water,
        vegetation: vegetation,
        socio_economic: socio_economic,
        access_data: access_data,
        microclimate: microclimate,
        buildings: buildings,
        zoning: zoning,
        soil: soil,
        aesthetics: aesthetics
      }.each do |key, value|
        errors.add(key, 'must be an object') unless value.is_a?(Hash)
      end
    end
  end
end
