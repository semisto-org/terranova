# frozen_string_literal: true

# Campfire (#145, tranche 119a) — socle backend du chat léger par projet.
# Message polymorphe `projectable` (PoleProject / Academy::Training /
# Design::Project / Guild) ; @mentions extraites du body (HTML TipTap, même
# convention que Comment #102) → Notification via NotificationService (#104).
# Index (projectable_type, projectable_id, created_at) pour l'historique
# paginé chronologique. PAS de diffusion temps réel ici (119b).
class CreateChatMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :chat_messages do |t|
      t.string :projectable_type, null: false
      t.bigint :projectable_id, null: false
      t.bigint :author_id
      t.text :body, null: false

      t.timestamps
    end

    add_index :chat_messages,
      %i[projectable_type projectable_id created_at],
      name: "index_chat_messages_on_projectable_and_created_at"
    add_index :chat_messages, :author_id
  end
end
