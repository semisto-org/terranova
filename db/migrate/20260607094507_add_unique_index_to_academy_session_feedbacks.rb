class AddUniqueIndexToAcademySessionFeedbacks < ActiveRecord::Migration[8.1]
  # Un·e participant·e ne laisse qu'un feedback par session (la re-soumission
  # met à jour la ligne existante côté contrôleur). Index partiel : ignore les
  # lignes soft-deleted; les contacts null (cas non utilisé ici) ne conflictent
  # pas (NULL distinct en Postgres).
  def change
    add_index :academy_session_feedbacks, [:session_id, :contact_id],
              unique: true, where: "deleted_at IS NULL AND contact_id IS NOT NULL",
              name: "idx_session_feedbacks_unique_per_contact"
  end
end
