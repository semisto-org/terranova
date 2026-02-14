module Plant
  class NurseryStock < ApplicationRecord
    self.table_name = 'plant_nursery_stocks'

    validates :target_type, :target_id, :nursery_id, :nursery_name, :quantity, :price, presence: true
  end
end
