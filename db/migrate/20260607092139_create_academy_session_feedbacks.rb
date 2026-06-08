class CreateAcademySessionFeedbacks < ActiveRecord::Migration[8.1]
  def change
    create_table :academy_session_feedbacks do |t|
      t.references :session, null: false, foreign_key: { to_table: :academy_training_sessions }
      t.bigint :contact_id # conservé même si anonyme (cf. QUESTIONS #5)
      t.integer :rating # 1..10, optionnel
      t.text :comment, null: false, default: ""
      t.boolean :anonymous, null: false, default: false
      t.datetime :deleted_at
      t.timestamps
    end
    add_index :academy_session_feedbacks, :deleted_at
    add_index :academy_session_feedbacks, :contact_id
  end
end
