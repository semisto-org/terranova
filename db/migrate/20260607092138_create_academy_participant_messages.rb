class CreateAcademyParticipantMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :academy_participant_messages do |t|
      t.references :training, null: false, foreign_key: { to_table: :academy_trainings }
      t.references :contact, null: false, foreign_key: true
      t.text :body, null: false, default: ""
      t.string :sender, null: false, default: "participant" # participant | team
      t.datetime :read_at
      t.bigint :author_member_id # membre de l'équipe ayant rédigé (réponses)
      t.datetime :deleted_at
      t.timestamps
    end
    add_index :academy_participant_messages, :deleted_at
    add_index :academy_participant_messages, [:training_id, :contact_id]
  end
end
