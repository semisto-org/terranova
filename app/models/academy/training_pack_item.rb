module Academy
  class TrainingPackItem < ApplicationRecord
    self.table_name = 'academy_training_pack_items'

    belongs_to :pack, class_name: 'Academy::TrainingPack'
    belongs_to :participant_category, class_name: 'Academy::ParticipantCategory'

    validates :quantity, numericality: { greater_than: 0 }
  end
end
