module Academy
  class TrainingExpense < ApplicationRecord
    self.table_name = 'academy_training_expenses'

    CATEGORIES = %w[location material food accommodation transport other].freeze

    belongs_to :training, class_name: 'Academy::Training'

    validates :category, :date, presence: true
    validates :category, inclusion: { in: CATEGORIES }
  end
end
