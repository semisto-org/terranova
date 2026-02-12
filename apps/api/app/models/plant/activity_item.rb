module Plant
  class ActivityItem < ApplicationRecord
    self.table_name = 'plant_activity_items'

    belongs_to :contributor, class_name: 'Plant::Contributor'

    validates :activity_type, :target_type, :target_id, :target_name, :timestamp, presence: true
  end
end
