module Plant
  class Photo < ApplicationRecord
    self.table_name = 'plant_photos'

    belongs_to :contributor, class_name: 'Plant::Contributor'

    validates :target_type, :target_id, :url, presence: true
  end
end
