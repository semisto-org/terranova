module Academy
  class Holiday < ApplicationRecord
    self.table_name = "academy_holidays"

    validates :date, presence: true, uniqueness: true
  end
end
