# frozen_string_literal: true

module Academy
  # Feedback d'un·e participant·e sur une journée/session (#21 « à froid » J+1,
  # #46 « à chaud »). Note 1-10 + texte, tout optionnel. `anonymous` masque
  # l'identité à l'affichage équipe (le contact reste lié en base, cf.
  # QUESTIONS #5 / RGPD).
  class SessionFeedback < ApplicationRecord
    include SoftDeletable
    self.table_name = "academy_session_feedbacks"

    belongs_to :session, class_name: "Academy::TrainingSession", foreign_key: :session_id
    belongs_to :contact, optional: true

    validates :rating, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 10 }, allow_nil: true
    validate :rating_or_comment_present

    scope :recent_first, -> { order(created_at: :desc) }

    private

    def rating_or_comment_present
      return if rating.present? || comment.to_s.strip.present?

      errors.add(:base, "Un feedback doit contenir une note ou un commentaire")
    end
  end
end
