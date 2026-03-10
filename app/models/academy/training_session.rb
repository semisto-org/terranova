module Academy
  class TrainingSession < ApplicationRecord
    include SoftDeletable
    self.table_name = 'academy_training_sessions'

    belongs_to :training, class_name: 'Academy::Training'
    has_many :attendances, class_name: 'Academy::TrainingAttendance', foreign_key: :session_id, dependent: :destroy
    has_many :documents, class_name: 'Academy::TrainingDocument', foreign_key: :session_id

    validates :start_date, :end_date, presence: true
  end
end
