module Academy
  class TrainingSession < ApplicationRecord
    include SoftDeletable
    self.table_name = 'academy_training_sessions'

    belongs_to :training, class_name: 'Academy::Training'
    has_many :attendances, class_name: 'Academy::TrainingAttendance', foreign_key: :session_id, dependent: :destroy
    has_many :documents, class_name: 'Academy::TrainingDocument', foreign_key: :session_id

    validates :start_date, :end_date, presence: true
    validates :photo_album_url,
              format: { with: %r{\Ahttps?://[^\s]+\z}, message: "doit être une URL valide (commençant par http)" },
              allow_blank: true

    # Génère les tâches automatiques (templates du type d'activité) pour la
    # session dès sa création. Idempotent côté générateur.
    after_create_commit :generate_template_tasks

    private

    def generate_template_tasks
      Academy::TaskGenerator.for_session(self)
    rescue StandardError => e
      Rails.logger.warn("[Academy::TaskGenerator] session #{id}: #{e.message}")
    end
  end
end
