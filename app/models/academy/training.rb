module Academy
  class Training < ApplicationRecord
    include SoftDeletable
    self.table_name = 'academy_trainings'

    STATUSES = %w[draft planned registrations_open in_progress completed cancelled].freeze

    belongs_to :training_type, class_name: 'Academy::TrainingType'
    has_many :sessions, class_name: 'Academy::TrainingSession', foreign_key: :training_id, dependent: :destroy
    has_many :registrations, class_name: 'Academy::TrainingRegistration', foreign_key: :training_id, dependent: :destroy
    has_many :documents, class_name: 'Academy::TrainingDocument', foreign_key: :training_id, dependent: :destroy
    has_many :expenses, class_name: "Expense", foreign_key: :training_id, dependent: :destroy

    validates :title, :status, presence: true
    validates :status, inclusion: { in: STATUSES }
    validates :vat_rate, numericality: { greater_than_or_equal_to: 0, less_than: 100 }

    def price_excl_vat
      vat_rate.to_f > 0 ? (price / (1 + vat_rate / 100.0)).round(2) : price
    end
  end
end
