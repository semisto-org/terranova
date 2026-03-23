module Academy
  class ParticipantCategory < ApplicationRecord
    include SoftDeletable
    self.table_name = 'academy_participant_categories'

    belongs_to :training, class_name: 'Academy::Training'
    has_many :registration_items, class_name: 'Academy::RegistrationItem', foreign_key: :participant_category_id, dependent: :restrict_with_error

    validates :label, presence: true
    validates :price, numericality: { greater_than_or_equal_to: 0 }
    validates :max_spots, numericality: { greater_than_or_equal_to: 0 }
    validates :deposit_amount, numericality: { greater_than_or_equal_to: 0 }

    def spots_taken
      registration_items
        .joins(:registration)
        .where(academy_training_registrations: { deleted_at: nil })
        .sum(:quantity)
    end

    def spots_remaining
      max_spots - spots_taken
    end
  end
end
