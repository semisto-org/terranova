module Plant
  class Location < ApplicationRecord
    self.table_name = 'plant_locations'

    validates :target_type, :target_id, :latitude, :longitude, presence: true
  end
end
