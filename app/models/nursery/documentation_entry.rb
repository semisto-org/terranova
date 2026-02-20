module Nursery
  class DocumentationEntry < ApplicationRecord
    self.table_name = 'nursery_documentation_entries'

    TYPES = %w[journal technical-sheet video-tutorial].freeze

    belongs_to :nursery, class_name: 'Nursery::Nursery', optional: true

    validates :title, :author_id, :author_name, :entry_type, :published_at, presence: true
    validates :entry_type, inclusion: { in: TYPES }
  end
end
