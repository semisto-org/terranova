# frozen_string_literal: true

class CreateUnifiedTaskSystem < ActiveRecord::Migration[8.1]
  def change
    # 1. Add polymorphic columns to task_lists (alongside existing FKs)
    add_column :task_lists, :taskable_type, :string
    add_column :task_lists, :taskable_id, :bigint
    add_index :task_lists, [:taskable_type, :taskable_id]

    # 2. Create unified tasks table (replaces actions + design_tasks)
    create_table :tasks do |t|
      t.string :name, null: false
      t.text :description
      t.string :status, null: false, default: "pending"
      t.date :due_date
      t.references :assignee, foreign_key: { to_table: :members }, null: true
      t.string :assignee_name
      t.string :priority
      t.jsonb :tags, default: []
      t.integer :time_minutes
      t.integer :position, default: 0
      t.references :parent, foreign_key: { to_table: :tasks }, null: true
      t.references :task_list, null: false, foreign_key: true

      t.timestamps
    end

    add_index :tasks, [:assignee_id, :status]

    # 3. Create project_memberships table
    create_table :project_memberships do |t|
      t.string :projectable_type, null: false
      t.bigint :projectable_id, null: false
      t.references :member, null: false, foreign_key: true
      t.string :role
      t.boolean :is_paid, default: false
      t.datetime :joined_at

      t.timestamps
    end

    add_index :project_memberships, [:projectable_type, :projectable_id], name: "index_project_memberships_on_projectable"
    add_index :project_memberships, [:projectable_type, :projectable_id, :member_id, :role], unique: true, name: "index_project_memberships_uniqueness"
  end
end
