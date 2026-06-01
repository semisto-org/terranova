# frozen_string_literal: true

# Séance 2 : étapes/tâches automatiques par type d'activité, avec une
# temporisation relative au début/fin de la session ou de l'activité.
# On suit le même pattern jsonb que default_categories / checklist_template
# (pas de nouvelle table). Chaque template :
#   { "name": "...", "scope": "activity"|"session", "anchor": "start"|"end", "offset_days": -90 }
# offset_days signé : négatif = avant l'ancre, positif = après.
class AddTaskTemplatesToAcademy < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_training_types, :task_templates, :jsonb, default: [], null: false

    # Lie une tâche générée à la session dont elle découle (provenance +
    # idempotence : on ne régénère pas si la session a déjà ses tâches).
    add_column :tasks, :academy_training_session_id, :bigint
    add_index :tasks, :academy_training_session_id
  end
end
