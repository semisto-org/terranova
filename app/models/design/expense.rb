module Design
  class Expense < ApplicationRecord
    self.table_name = 'design_expenses'

    CATEGORIES = %w[plants material travel services other].freeze
    STATUSES = %w[pending approved rejected].freeze

    belongs_to :project, class_name: 'Design::Project'

    validates :date, :amount, :category, :phase, :status, presence: true
    validates :category, inclusion: { in: CATEGORIES }
    validates :status, inclusion: { in: STATUSES }
  end
end
