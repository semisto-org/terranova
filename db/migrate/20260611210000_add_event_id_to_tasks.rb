# frozen_string_literal: true

# Lien tâche ↔ réunion (#37) : FK simple `event_id` sur `tasks` (une tâche =
# une seule réunion), calquée sur le précédent `academy_training_session_id`.
# Nullable + index, pas de contrainte FK stricte (cohérent avec le précédent ;
# le détachement se fait par `dependent: :nullify` côté modèle Event).
class AddEventIdToTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :tasks, :event_id, :bigint
    add_index :tasks, :event_id
  end
end
