module Academy
  class RegistrationItem < ApplicationRecord
    self.table_name = 'academy_registration_items'

    belongs_to :registration, class_name: 'Academy::TrainingRegistration'
    belongs_to :participant_category, class_name: 'Academy::ParticipantCategory'

    validates :quantity, numericality: { greater_than: 0 }
    validates :unit_price, numericality: { greater_than_or_equal_to: 0 }
    validates :discount_percent, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

    before_save :compute_subtotal

    private

    def compute_subtotal
      self.subtotal = (unit_price * quantity * (1 - discount_percent / 100.0)).round(2)
    end
  end
end
