module Design
  # Prélèvement de sol (étape Observation / relevé) : localisation, profondeur,
  # drapeau polluants, suivi du laboratoire et résultats.
  class SoilSample < ApplicationRecord
    self.table_name = 'design_soil_samples'

    LAB_STATUSES = %w[pending sent received].freeze

    belongs_to :project, class_name: 'Design::Project', foreign_key: :project_id

    validates :location_label, presence: true
    validates :lab_status, inclusion: { in: LAB_STATUSES }
  end
end
