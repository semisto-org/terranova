class CreateReactions < ActiveRecord::Migration[8.1]
  # Réactions polymorphes (#111) — substrat « Boost » Basecamp. Généralise le
  # précédent non polymorphe strategy_comment_reactions (conservé, lu via un
  # pont en lecture — aucune migration destructive ici).
  def change
    create_table :reactions do |t|
      t.string :reactable_type, null: false
      t.bigint :reactable_id, null: false
      t.bigint :member_id, null: false
      t.string :content, null: false
      t.timestamps
    end

    # Une réaction d'un contenu donné par membre et par objet.
    add_index :reactions, %i[member_id reactable_type reactable_id content],
              unique: true, name: "index_reactions_uniqueness"
    add_index :reactions, %i[reactable_type reactable_id]
    add_foreign_key :reactions, :members
  end
end
