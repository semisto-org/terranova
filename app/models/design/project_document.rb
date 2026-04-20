module Design
  class ProjectDocument < ApplicationRecord
    include SoftDeletable
    self.table_name = 'design_project_documents'

    belongs_to :project, class_name: 'Design::Project', optional: true
    has_one_attached :file

    validates :category, :name, :uploaded_at, presence: true
    validate :file_or_url_present

    private

    def file_or_url_present
      return if file.attached? || url.present?
      errors.add(:base, 'Veuillez joindre un fichier')
    end
  end
end
