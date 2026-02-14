class HillChartSnapshot < ApplicationRecord
  belongs_to :pitch

  validates :positions, presence: true
end
