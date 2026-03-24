module Academy
  class TrainingType < ApplicationRecord
    include SoftDeletable
    self.table_name = 'academy_training_types'

    COLORS = %w[
      #EF4444 #F97316 #F59E0B #EAB308
      #84CC16 #22C55E #14B8A6 #06B6D4
      #3B82F6 #6366F1 #8B5CF6 #A855F7
      #EC4899 #F43F5E #78716C #6B7280
    ].freeze

    attribute :color, :string, default: '#6B7280'

    has_many :trainings, class_name: 'Academy::Training', foreign_key: :training_type_id, dependent: :restrict_with_error

    validates :name, presence: true
    validates :color, inclusion: { in: COLORS }
  end
end
