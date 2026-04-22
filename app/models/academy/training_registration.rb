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
    has_many :revenues, as: :projectable, class_name: '::Revenue'

    validates :contact_name, :payment_status, :registered_at, presence: true
    validates :payment_status, inclusion: { in: PAYMENT_STATUSES }
    validates :carpooling, inclusion: { in: CARPOOLING_OPTIONS }

    def recompute_payment_amount!
      items_total = registration_items.sum(:subtotal)
      packs_total = registration_packs.sum(:subtotal)
      update!(payment_amount: items_total + packs_total)
    end

    def recompute_payment_status_from_revenues!
      received_total = revenues.where(status: 'received').sum(:amount)
      total_due = payment_amount.to_d
      new_status =
        if received_total >= total_due - BankReconciliation::AMOUNT_TOLERANCE && total_due > 0
          'paid'
        elsif received_total > 0
          'partial'
        else
          'pending'
        end
      update!(amount_paid: received_total, payment_status: new_status)
    end
  end
end
