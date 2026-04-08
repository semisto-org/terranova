# frozen_string_literal: true

class CleanupLegacyTaskSystem < ActiveRecord::Migration[8.1]
  def up
    # Remove legacy FK columns from task_lists (now using polymorphic)
    remove_index :task_lists, :pole_project_id, if_exists: true
    remove_index :task_lists, :training_id, if_exists: true
    remove_index :task_lists, :guild_id, if_exists: true
    remove_column :task_lists, :pole_project_id, :bigint
    remove_column :task_lists, :training_id, :bigint
    remove_column :task_lists, :guild_id, :bigint

    # Make polymorphic columns NOT NULL
    change_column_null :task_lists, :taskable_type, false
    change_column_null :task_lists, :taskable_id, false

    # Drop legacy tables
    drop_table :design_tasks
    drop_table :design_task_lists
    drop_table :design_actions
    drop_table :guild_memberships

    # Remove legacy columns from pole_projects
    remove_column :pole_projects, :team_names, :jsonb
    remove_column :pole_projects, :lead_name, :string
  end

  def down
    add_column :pole_projects, :lead_name, :string
    add_column :pole_projects, :team_names, :jsonb, default: []

    create_table :guild_memberships do |t|
      t.bigint :guild_id, null: false
      t.bigint :member_id, null: false
      t.timestamps
      t.index [:guild_id, :member_id], unique: true
      t.index :guild_id
      t.index :member_id
    end

    create_table :design_actions do |t|
      t.timestamps
    end

    create_table :design_task_lists do |t|
      t.string :name, null: false
      t.integer :position, default: 0
      t.bigint :project_id, null: false
      t.timestamps
      t.index :project_id
    end

    create_table :design_tasks do |t|
      t.bigint :assignee_id
      t.string :assignee_name
      t.date :due_date
      t.string :name, null: false
      t.text :notes
      t.integer :position, default: 0
      t.string :status, default: "pending"
      t.bigint :task_list_id, null: false
      t.timestamps
      t.index :assignee_id
      t.index :task_list_id
    end

    add_column :task_lists, :guild_id, :bigint
    add_column :task_lists, :training_id, :bigint
    add_column :task_lists, :pole_project_id, :bigint
    add_index :task_lists, :guild_id
    add_index :task_lists, :training_id
    add_index :task_lists, :pole_project_id

    change_column_null :task_lists, :taskable_type, true
    change_column_null :task_lists, :taskable_id, true
  end
end
