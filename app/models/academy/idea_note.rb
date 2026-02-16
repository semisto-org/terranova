module Academy
  class IdeaNote < ApplicationRecord
    include SoftDeletable
    self.table_name = 'academy_idea_notes'

    CATEGORIES = %w[subject trainer location other].freeze

    validates :category, :title, presence: true
    validates :category, inclusion: { in: CATEGORIES }
  end
end
