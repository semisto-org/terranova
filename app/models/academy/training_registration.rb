module Academy
  class TrainingRegistration < ApplicationRecord
    include SoftDeletable
    self.table_name = 'academy_training_registrations'

    PAYMENT_STATUSES = %w[pending partial paid].freeze
    CARPOOLING_OPTIONS = %w[none seeking offering].freeze

    belongs_to :training, class_name: 'Academy::Training'
    has_many :attendances, class_name: 'Academy::TrainingAttendance', foreign_key: :registration_id, dependent: :destroy

    validates :contact_name, :payment_status, :registered_at, presence: true
    validates :payment_status, inclusion: { in: PAYMENT_STATUSES }
    validates :carpooling, inclusion: { in: CARPOOLING_OPTIONS }
  end
end
