class CreateEventActionItems < ActiveRecord::Migration[8.1]
  # Pipeline « de la réunion aux tâches » (#47) — substrat. Un point d'action
  # d'un compte-rendu de réunion : état proposed → validated (gate du
  # coordinateur). À la validation, une Task assignée est créée, rattachée à la
  # réunion (event_id, #37) et au projet, avec traçabilité (task_id).
  def change
    create_table :event_action_items do |t|
      t.bigint :event_id, null: false
      t.text :description, null: false
      t.string :status, null: false, default: "proposed"
      t.bigint :assignee_id
      t.bigint :task_id
      t.bigint :created_by_id
      t.integer :position, null: false, default: 0
      t.timestamps
    end

    add_index :event_action_items, :event_id
    add_index :event_action_items, :status
    add_index :event_action_items, :task_id
    add_foreign_key :event_action_items, :events
    add_foreign_key :event_action_items, :tasks
  end
end
