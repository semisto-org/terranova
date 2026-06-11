module Academy
  # Feedback « à chaud » rempli par un·e participant·e après une session.
  # Note globale 1–5, recommandation oui/non, commentaire libre.
  # Une réponse unique par (session × participant), non modifiable une fois posée.
  class SessionFeedback < ApplicationRecord
    self.table_name = 'academy_session_feedbacks'

    belongs_to :session, class_name: 'Academy::TrainingSession', foreign_key: :session_id
    belongs_to :contact, class_name: '::Contact'

    validates :rating, inclusion: { in: 1..5 }
    validates :would_recommend, inclusion: { in: [true, false] }
    validates :contact_id, uniqueness: { scope: :session_id,
                                         message: "a déjà laissé un avis pour cette session" }
  end
end
