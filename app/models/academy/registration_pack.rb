module Academy
  class RegistrationPack < ApplicationRecord
    self.table_name = 'academy_registration_packs'

    belongs_to :registration, class_name: 'Academy::TrainingRegistration'
    belongs_to :pack, class_name: 'Academy::TrainingPack'

    validates :quantity, numericality: { greater_than: 0 }
    validates :unit_price, numericality: { greater_than_or_equal_to: 0 }

    before_save :compute_subtotal

    private

    def compute_subtotal
      self.subtotal = (unit_price * quantity).round(2)
    end
  end
end
