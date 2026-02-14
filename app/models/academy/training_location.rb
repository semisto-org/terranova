module Academy
  class TrainingLocation < ApplicationRecord
    self.table_name = 'academy_training_locations'

    validates :name, presence: true
  end
end
