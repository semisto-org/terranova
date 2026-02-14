module Design
  class Intervention < ApplicationRecord
    self.table_name = 'design_interventions'

    TYPES = %w[planting mulching pruning watering treatment replacement other].freeze

    belongs_to :project, class_name: 'Design::Project'
    belongs_to :plant_record, class_name: 'Design::PlantRecord', optional: true

    validates :date, :intervention_type, presence: true
    validates :intervention_type, inclusion: { in: TYPES }
  end
end
