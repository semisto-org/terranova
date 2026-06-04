module Design
  # Entrée du carnet d'observation (étape Observation / promenade sensible) :
  # note subjective + médias (photo/vidéo/audio) capturés sur le terrain, géotaggables.
  class ObservationNote < ApplicationRecord
    self.table_name = 'design_observation_notes'

    belongs_to :project, class_name: 'Design::Project', foreign_key: :project_id
    has_many_attached :media

    validates :body, presence: true, unless: -> { media.attached? }

    before_validation :stamp_captured_at, on: :create

    private

    def stamp_captured_at
      self.captured_at ||= Time.current
    end
  end
end
