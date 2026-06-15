# Abonnements polymorphes (#103, epic #101) — le mécanisme qui rend les
# notifications (#104) calmes : on n'est notifié que de ce qu'on suit.
#
# Une seule table porte les quatre états :
#   auto         — abonnement implicite (assignation, commentaire, mention, auteur)
#   explicit     — suivi choisi par le membre (prime sur le mute projet)
#   unsubscribed — désabonnement explicite (jamais écrasé par un auto futur)
#   muted        — uniquement sur un Projectable : silence tout le projet
class CreateSubscriptions < ActiveRecord::Migration[8.1]
  def change
    create_table :subscriptions do |t|
      t.string :subscribable_type, null: false
      t.bigint :subscribable_id, null: false
      t.references :member, null: false, foreign_key: true
      t.string :state, null: false, default: "auto"
      t.timestamps
    end

    add_index :subscriptions, [:member_id, :subscribable_type, :subscribable_id],
      unique: true, name: "index_subscriptions_on_member_and_subscribable"
    add_index :subscriptions, [:subscribable_type, :subscribable_id, :state],
      name: "index_subscriptions_on_subscribable_and_state"
  end
end
