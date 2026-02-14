module Plant
  class Note < ApplicationRecord
    self.table_name = 'plant_notes'

    belongs_to :contributor, class_name: 'Plant::Contributor'

    validates :target_type, :target_id, :content, :language, presence: true
  end
end
