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

    # Authoritative expected amount for this registration.
    # The stored `payment_amount` column is only refreshed by `recompute_payment_amount!`,
    # which isn't called for registrations created without items/packs (free / comp,
    # legacy data, etc.). This method always returns the right value:
    #   - sum of items/packs subtotals when present
    #   - 0 for a comp on a modern training (categories/packs configured)
    #   - training.price for legacy trainings priced via the single-price column
    def computed_expected_amount
      items_total = registration_items.sum(:subtotal).to_f
      packs_total = registration_packs.sum(:subtotal).to_f
      line_total = items_total + packs_total
      return line_total if line_total.positive?

      # Inscription orpheline : sa formation a été soft-deleted (default_scope
      # → `training` est nil). On ne lève pas, on renvoie 0.0 (#137).
      return 0.0 unless training

      modern_pricing = training.participant_categories.any? || training.packs.any?
      modern_pricing ? 0.0 : training.price.to_f
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
