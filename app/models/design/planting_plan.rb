module Design
  class PlantingPlan < ApplicationRecord
    self.table_name = 'design_planting_plans'

    belongs_to :project, class_name: 'Design::Project'
    has_many :markers, class_name: 'Design::PlantMarker', foreign_key: :planting_plan_id, dependent: :destroy
    has_one_attached :background_image

    validates :layout, presence: true
  end
end
