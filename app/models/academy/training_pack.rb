module Academy
  class TrainingPack < ApplicationRecord
    include SoftDeletable
    self.table_name = 'academy_training_packs'

    belongs_to :training, class_name: 'Academy::Training'
    has_many :pack_items, class_name: 'Academy::TrainingPackItem', foreign_key: :pack_id, dependent: :destroy
    has_many :registration_packs, class_name: 'Academy::RegistrationPack', foreign_key: :pack_id, dependent: :restrict_with_error

    validates :name, presence: true
    validates :price, numericality: { greater_than_or_equal_to: 0 }
    validates :deposit_amount, numericality: { greater_than_or_equal_to: 0 }

    def savings
      individual_total = pack_items.includes(:participant_category).sum { |pi|
        pi.participant_category.price * pi.quantity
      }
      individual_total - price
    end

    def available?(extra_spots_needed = {})
      pack_items.includes(:participant_category).all? do |pi|
        needed = pi.quantity + (extra_spots_needed[pi.participant_category_id] || 0)
        pi.participant_category.spots_remaining >= needed
      end
    end
  end
end
