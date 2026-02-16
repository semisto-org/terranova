module Academy
  class TrainingDocument < ApplicationRecord
    self.table_name = 'academy_training_documents'

    TYPES = %w[pdf image video other].freeze

    belongs_to :training, class_name: 'Academy::Training'
    has_one_attached :file

    validates :name, :document_type, :uploaded_at, presence: true
    validates :document_type, inclusion: { in: TYPES }
    validate :file_or_legacy_url_present

    private

    def file_or_legacy_url_present
      return if file.attached? || url.present?
      errors.add(:file, I18n.t('errors.messages.blank'))
    end
  end
end
