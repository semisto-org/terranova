# Substrat commentaires + @mentions polymorphe (#102, epic #101).
#
# ⚠️ Contexte : les tables `comments`/`mentions` figurent déjà dans db/schema.rb
# (entrées par contamination dans le commit 9c7b55a / PR #113, sans fichier de
# migration) — les environnements chargés par schema:load (dev/test/CI) les ont,
# mais la PROD (db:migrate) ne les a jamais créées. Cette migration est donc
# gardée : no-op là où les tables existent, création à l'identique ailleurs.
# La forme reproduit EXACTEMENT celle du schema.rb pour zéro dérive.
#
# Le couple (commentable_type, commentable_id) n'impose aucune liste fermée de
# types : Task et Event sont les premiers câblés, les suivants (Post #118,
# Projectable…) s'ajoutent sans migration.
class CreateCommentsAndMentions < ActiveRecord::Migration[8.1]
  def up
    unless table_exists?(:comments)
      create_table :comments do |t|
        t.bigint :author_id
        t.text :body, null: false
        t.bigint :commentable_id, null: false
        t.string :commentable_type, null: false
        t.datetime :created_at, null: false
        t.datetime :edited_at
        t.datetime :updated_at, null: false
        t.index [:author_id], name: "index_comments_on_author_id"
        t.index [:commentable_type, :commentable_id], name: "index_comments_on_commentable"
      end
    end

    unless table_exists?(:mentions)
      create_table :mentions do |t|
        t.bigint :comment_id, null: false
        t.datetime :created_at, null: false
        t.bigint :member_id, null: false
        t.datetime :updated_at, null: false
        t.index [:comment_id, :member_id], name: "index_mentions_on_comment_id_and_member_id", unique: true
        t.index [:comment_id], name: "index_mentions_on_comment_id"
        t.index [:member_id], name: "index_mentions_on_member_id"
      end
    end
  end

  def down
    drop_table :mentions, if_exists: true
    drop_table :comments, if_exists: true
  end
end
