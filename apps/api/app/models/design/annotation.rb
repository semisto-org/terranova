module Design
  class Annotation < ApplicationRecord
    self.table_name = 'design_annotations'

    AUTHOR_TYPES = %w[team client].freeze

    belongs_to :project, class_name: 'Design::Project'

    validates :document_id, :author_id, :author_name, :author_type, :content, presence: true
    validates :author_type, inclusion: { in: AUTHOR_TYPES }
  end
end
