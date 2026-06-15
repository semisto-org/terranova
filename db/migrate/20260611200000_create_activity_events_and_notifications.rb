# Cœur de la couche async calme (#104, epic #101, amendement 11/06) :
#
#   ActivityEvent  — 1 ligne par action (flux ambiant, source de vérité).
#                    Consommé par Activity (#110) ; AUCUN destinataire ici.
#   Notification   — dérivée d'un ActivityEvent, 1 ligne par destinataire
#                    abonné/mentionné (#103). Consommée par le Hey! (#105).
#
# Le service écrit TOUJOURS l'événement d'abord, puis fan-out les
# notifications — jamais l'inverse (décision d'architecture du 11/06).
class CreateActivityEventsAndNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :activity_events do |t|
      t.bigint :actor_id # nullable : certains événements n'ont pas d'acteur (cf. #110)
      t.string :action, null: false
      t.string :subject_type, null: false
      t.bigint :subject_id, null: false
      t.string :projectable_type
      t.bigint :projectable_id
      t.timestamps

      t.index [:projectable_type, :projectable_id, :created_at], name: "index_activity_events_on_projectable_and_created_at"
      t.index [:subject_type, :subject_id], name: "index_activity_events_on_subject"
      t.index [:created_at], name: "index_activity_events_on_created_at"
    end

    create_table :notifications do |t|
      t.references :recipient, null: false, foreign_key: { to_table: :members }
      t.references :activity_event, null: false, foreign_key: true
      t.string :notifiable_type, null: false
      t.bigint :notifiable_id, null: false
      t.string :kind, null: false
      t.bigint :actor_id
      t.datetime :read_at
      t.timestamps

      t.index [:recipient_id, :read_at], name: "index_notifications_on_recipient_and_read_at"
      # Idempotence du fan-out : un même événement ne notifie jamais deux fois
      # le même destinataire.
      t.index [:recipient_id, :activity_event_id], unique: true, name: "index_notifications_on_recipient_and_event"
    end
  end
end
