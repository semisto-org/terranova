module Academy
  class Training < ApplicationRecord
    include SoftDeletable
    self.table_name = 'academy_trainings'

    STATUSES = %w[idea to_organize in_preparation to_publish published in_progress post_training cancelled completed].freeze
    REGISTRATION_MODES = %w[open closed].freeze

    belongs_to :training_type, class_name: 'Academy::TrainingType'
    has_many :sessions, class_name: 'Academy::TrainingSession', foreign_key: :training_id, dependent: :destroy
    has_many :registrations, class_name: 'Academy::TrainingRegistration', foreign_key: :training_id, dependent: :destroy
    has_many :documents, class_name: 'Academy::TrainingDocument', foreign_key: :training_id, dependent: :destroy
    has_many :expenses, class_name: "Expense", foreign_key: :training_id, dependent: :destroy
    has_many :revenues, class_name: "Revenue", foreign_key: :training_id, dependent: :destroy
    has_one :album, as: :albumable, dependent: :destroy

    validates :title, :status, presence: true
    after_update :create_album_when_planned, if: :saved_change_to_status?
    validates :status, inclusion: { in: STATUSES }
    validates :registration_mode, inclusion: { in: REGISTRATION_MODES }, allow_blank: true
    validates :vat_rate, numericality: { greater_than_or_equal_to: 0, less_than: 100 }
    validates :deposit_amount, numericality: { greater_than_or_equal_to: 0 }

    def price_excl_vat
      vat_rate.to_f > 0 ? (price / (1 + vat_rate / 100.0)).round(2) : price
    end

    private

    def create_album_when_planned
      return unless status == "planned"
      return if album.present?

      create_album!(title: title, albumable: self)
    end
  end
end
