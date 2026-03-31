module Academy
  class TrainingRegistration < ApplicationRecord
    include SoftDeletable
    self.table_name = 'academy_training_registrations'

    PAYMENT_STATUSES = %w[pending partial paid].freeze
    CARPOOLING_OPTIONS = %w[none seeking offering].freeze

    belongs_to :training, class_name: 'Academy::Training'
    belongs_to :contact, optional: true
    has_many :attendances, class_name: 'Academy::TrainingAttendance', foreign_key: :registration_id, dependent: :destroy
    has_many :registration_items, class_name: 'Academy::RegistrationItem', foreign_key: :registration_id, dependent: :destroy
    has_many :registration_packs, class_name: 'Academy::RegistrationPack', foreign_key: :registration_id, dependent: :destroy

    validates :contact_name, :payment_status, :registered_at, presence: true
    validates :payment_status, inclusion: { in: PAYMENT_STATUSES }
    validates :carpooling, inclusion: { in: CARPOOLING_OPTIONS }

    def recompute_payment_amount!
      items_total = registration_items.sum(:subtotal)
      packs_total = registration_packs.sum(:subtotal)
      update!(payment_amount: items_total + packs_total)
    end
  end
end
