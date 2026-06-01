# frozen_string_literal: true

class AddTrackingFieldsToTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :tasks, :notes, :text
    add_column :tasks, :assigned_at, :datetime
    add_column :tasks, :assigned_by_id, :bigint
    add_column :tasks, :completed_at, :datetime
    add_column :tasks, :completed_by_id, :bigint
    add_column :tasks, :starred_at, :datetime
    add_column :tasks, :pinged_at, :datetime
    add_column :tasks, :pinged_by_id, :bigint

    add_index :tasks, :assigned_by_id
    add_index :tasks, :completed_by_id
    add_index :tasks, :pinged_by_id
    add_index :tasks, :starred_at
    add_index :tasks, :pinged_at

    # Backfill : les tâches déjà terminées reçoivent un completed_at plausible
    # (leur updated_at) pour ne pas toutes remonter dans « récemment terminé ».
    reversible do |dir|
      dir.up do
        execute <<~SQL
          UPDATE tasks SET completed_at = updated_at WHERE status = 'completed' AND completed_at IS NULL
        SQL
        execute <<~SQL
          UPDATE tasks SET assigned_at = created_at WHERE assignee_id IS NOT NULL AND assigned_at IS NULL
        SQL
      end
    end
  end
end
