module Plant
  class CommonName < ApplicationRecord
    self.table_name = 'plant_common_names'

    validates :target_type, :target_id, :language, :name, presence: true
  end
end
