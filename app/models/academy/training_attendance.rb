module Academy
  class TrainingAttendance < ApplicationRecord
    self.table_name = 'academy_training_attendances'

    belongs_to :registration, class_name: 'Academy::TrainingRegistration'
    belongs_to :session, class_name: 'Academy::TrainingSession'

    validates :status, inclusion: { in: %w[present partial absent] }
  end
end
