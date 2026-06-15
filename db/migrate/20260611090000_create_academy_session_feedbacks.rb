# Feedback « à chaud » d'un·e participant·e sur une session d'activité Academy.
# Une réponse unique par (session × participant), non modifiable côté portail.
class CreateAcademySessionFeedbacks < ActiveRecord::Migration[8.1]
  def change
    create_table :academy_session_feedbacks do |t|
      t.references :session, null: false,
                   foreign_key: { to_table: :academy_training_sessions }
      t.references :contact, null: false, foreign_key: true
      t.integer :rating, null: false
      t.boolean :would_recommend, null: false
      t.text :comment, null: false, default: ""

      t.timestamps
    end

    # Une seule réponse par participant·e et par session.
    add_index :academy_session_feedbacks, %i[session_id contact_id], unique: true
  end
end
