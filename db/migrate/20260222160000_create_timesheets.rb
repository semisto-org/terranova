# frozen_string_literal: true

class CreateTimesheets < ActiveRecord::Migration[8.0]
  def up
    # Drop and recreate if table exists with wrong schema (from earlier partial migration)
    drop_table :timesheets, if_exists: true

    create_table :timesheets do |t|
      t.text :description
      t.date :date, null: false
      t.decimal :hours, precision: 5, scale: 2, default: 0
      t.integer :travel_km, default: 0

      t.string :member_id, null: false
      t.string :member_name, null: false

      t.string :phase
      t.string :mode
      t.boolean :billed, default: false

      t.references :design_project, foreign_key: { to_table: :design_projects }, null: true
      t.references :training, foreign_key: { to_table: :academy_trainings }, null: true
      t.references :pole_project, foreign_key: { to_table: :pole_projects }, null: true
      t.references :event, foreign_key: { to_table: :events }, null: true

      t.string :notion_id
      t.datetime :notion_created_at
      t.datetime :notion_updated_at

      t.timestamps
    end

    add_index :timesheets, :notion_id, unique: true
    add_index :timesheets, :member_id
    add_index :timesheets, :date

    # Migrate existing data from design_project_timesheets
    if table_exists?(:design_project_timesheets)
      execute <<~SQL
        INSERT INTO timesheets (
          description, date, hours, travel_km,
          member_id, member_name, phase, mode,
          design_project_id,
          created_at, updated_at
        )
        SELECT
          notes, date, hours, travel_km,
          member_id, member_name, phase, mode,
          project_id,
          created_at, updated_at
        FROM design_project_timesheets
        WHERE deleted_at IS NULL
      SQL
    end
  end

  def down
    drop_table :timesheets
  end
end
