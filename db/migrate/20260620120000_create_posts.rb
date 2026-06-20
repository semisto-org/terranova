# Message Board par projet (#118, epic #101 — Phase 4 « outils par projet »).
#
# Un Post = annonce / proposition / compte-rendu async structuré (l'équivalent
# Basecamp 5 du Message Board), rattaché polymorphiquement à un Projectable
# (PoleProject, Design::Project, Academy::Training, Guild). `body` est du HTML
# TipTap, stocké en text et sanitizé au modèle (SanitizesRichText) — même forme
# que Comment#body.
#
# Le couple (projectable_type, projectable_id) n'impose aucune liste fermée :
# tout Projectable peut porter des posts. Le post est lui-même commentable
# (#102), suivable (#103) et alimente Activity/Notifications (#104/#110).
class CreatePosts < ActiveRecord::Migration[8.1]
  def change
    create_table :posts do |t|
      t.string :title, null: false
      t.text :body, null: false, default: ""
      t.bigint :author_id
      t.string :projectable_type, null: false
      t.bigint :projectable_id, null: false
      t.timestamps
    end

    add_index :posts, [:projectable_type, :projectable_id, :created_at],
              name: "index_posts_on_projectable_and_created_at"
    add_index :posts, :author_id
  end
end
