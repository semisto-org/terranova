module Academy
  class TrainingType < ApplicationRecord
    include SoftDeletable
    self.table_name = 'academy_training_types'

    has_many :trainings, class_name: 'Academy::Training', foreign_key: :training_type_id, dependent: :restrict_with_error

    validates :name, presence: true
  end
end
