module Academy
  class Training < ApplicationRecord
    self.table_name = 'academy_trainings'

    STATUSES = %w[draft planned registrations_open in_progress completed cancelled].freeze

    belongs_to :training_type, class_name: 'Academy::TrainingType'
    has_many :sessions, class_name: 'Academy::TrainingSession', foreign_key: :training_id, dependent: :destroy
    has_many :registrations, class_name: 'Academy::TrainingRegistration', foreign_key: :training_id, dependent: :destroy
    has_many :documents, class_name: 'Academy::TrainingDocument', foreign_key: :training_id, dependent: :destroy
    has_many :expenses, class_name: 'Academy::TrainingExpense', foreign_key: :training_id, dependent: :destroy

    validates :title, :status, presence: true
    validates :status, inclusion: { in: STATUSES }
  end
end
