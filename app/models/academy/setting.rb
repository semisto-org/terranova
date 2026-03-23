module Academy
  class Setting < ApplicationRecord
    self.table_name = 'academy_settings'

    validates :volume_discount_per_spot, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
    validates :volume_discount_max, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

    def self.current
      first_or_create!(volume_discount_per_spot: 10.0, volume_discount_max: 30.0)
    end

    def discount_for_quantity(qty)
      return 0 if qty <= 1
      [volume_discount_per_spot * (qty - 1), volume_discount_max].min.clamp(0, 100)
    end
  end
end
