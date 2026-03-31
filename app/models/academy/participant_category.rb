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
      individual = registration_items
        .joins(:registration)
        .where(academy_training_registrations: { deleted_at: nil })
        .sum(:quantity)

      pack_spots = Academy::RegistrationPack
        .joins(:registration, pack: :pack_items)
        .where(academy_training_registrations: { deleted_at: nil })
        .where(academy_training_pack_items: { participant_category_id: id })
        .sum("academy_registration_packs.quantity * academy_training_pack_items.quantity")

      individual + pack_spots
    end

    def spots_remaining
      max_spots - spots_taken
    end
  end
end
