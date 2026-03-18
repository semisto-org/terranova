class AddGuildIdToTaskListsAndActions < ActiveRecord::Migration[8.1]
  def change
    add_reference :task_lists, :guild, null: true, foreign_key: true
    add_reference :actions, :guild, null: true, foreign_key: true
  end
end
