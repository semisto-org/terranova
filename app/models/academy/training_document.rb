module Academy
  class TrainingDocument < ApplicationRecord
    include SoftDeletable
    self.table_name = 'academy_training_documents'

    belongs_to :training, class_name: 'Academy::Training'
    has_one_attached :file

    validates :name, :uploaded_at, presence: true
    validate :file_or_legacy_url_present

    private

    def file_or_legacy_url_present
      return if file.attached? || url.present?
      errors.add(:file, I18n.t('errors.messages.blank'))
    end
  end
end
