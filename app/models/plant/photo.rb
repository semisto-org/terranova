module Plant
  class Photo < ApplicationRecord
    self.table_name = 'plant_photos'

    ROLES = %w[flower fruit foliage habit general].freeze

    belongs_to :contributor, class_name: 'Plant::Contributor'

    validates :target_type, :target_id, :url, presence: true
    validates :role, inclusion: { in: ROLES }, allow_nil: true
  end
end
