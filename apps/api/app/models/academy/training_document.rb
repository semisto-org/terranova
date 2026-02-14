module Academy
  class TrainingDocument < ApplicationRecord
    self.table_name = 'academy_training_documents'

    TYPES = %w[pdf link image video].freeze

    belongs_to :training, class_name: 'Academy::Training'

    validates :name, :document_type, :url, :uploaded_at, presence: true
    validates :document_type, inclusion: { in: TYPES }
  end
end
