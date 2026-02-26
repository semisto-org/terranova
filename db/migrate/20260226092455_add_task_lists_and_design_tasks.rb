# frozen_string_literal: true

class AddTaskListsAndDesignTasks < ActiveRecord::Migration[8.1]
  def change
    # Task lists for Lab projects (PoleProject) and trainings
    create_table :task_lists do |t|
      t.string :name, null: false
      t.integer :position, default: 0
      t.references :pole_project, foreign_key: true, null: true
      t.references :training, foreign_key: { to_table: :academy_trainings }, null: true
      t.timestamps
    end

    # Link actions to task lists
    add_reference :actions, :task_list, foreign_key: true, null: true

    # Link events to pole projects
    add_reference :events, :pole_project, foreign_key: true, null: true

    # Design task lists
    create_table :design_task_lists do |t|
      t.string :name, null: false
      t.integer :position, default: 0
      t.references :project, foreign_key: { to_table: :design_projects }, null: false
      t.timestamps
    end

    # Design tasks
    create_table :design_tasks do |t|
      t.string :name, null: false
      t.string :status, default: "pending"
      t.date :due_date
      t.references :assignee, foreign_key: { to_table: :members }, null: true
      t.string :assignee_name
      t.text :notes
      t.integer :position, default: 0
      t.references :task_list, foreign_key: { to_table: :design_task_lists }, null: false
      t.timestamps
    end
  end
end
