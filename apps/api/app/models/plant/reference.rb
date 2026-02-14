module Plant
  class Reference < ApplicationRecord
    self.table_name = 'plant_references'

    validates :target_type, :target_id, :reference_type, :title, :url, presence: true
  end
end
