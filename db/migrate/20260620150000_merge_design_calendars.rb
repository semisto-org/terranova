class MergeDesignCalendars < ActiveRecord::Migration[8.1]
  # Fusionne design_harvest_calendars + design_maintenance_calendars (schéma
  # strictement identique) en une seule table design_calendars discriminée par
  # calendar_type. Transfère les données puis supprime les deux anciennes
  # tables. Réf #161 / docs/data-model/REFACTORING.md (Q6).
  def up
    create_table :design_calendars do |t|
      t.bigint :project_id, null: false
      t.string :calendar_type, null: false
      t.jsonb :months, default: [], null: false
      t.timestamps
    end
    add_index :design_calendars, %i[project_id calendar_type], unique: true,
              name: "index_design_calendars_on_project_and_type"
    add_foreign_key :design_calendars, :design_projects, column: :project_id

    say_with_time "Transfert des calendriers de récolte" do
      execute <<~SQL.squish
        INSERT INTO design_calendars (project_id, calendar_type, months, created_at, updated_at)
        SELECT project_id, 'harvest', months, created_at, updated_at FROM design_harvest_calendars
      SQL
    end
    say_with_time "Transfert des calendriers d'entretien" do
      execute <<~SQL.squish
        INSERT INTO design_calendars (project_id, calendar_type, months, created_at, updated_at)
        SELECT project_id, 'maintenance', months, created_at, updated_at FROM design_maintenance_calendars
      SQL
    end

    drop_table :design_harvest_calendars
    drop_table :design_maintenance_calendars
  end

  def down
    create_table :design_harvest_calendars do |t|
      t.jsonb :months, default: [], null: false
      t.bigint :project_id, null: false
      t.timestamps
      t.index :project_id, unique: true, name: "index_design_harvest_calendars_on_project_id"
    end
    add_foreign_key :design_harvest_calendars, :design_projects, column: :project_id

    create_table :design_maintenance_calendars do |t|
      t.jsonb :months, default: [], null: false
      t.bigint :project_id, null: false
      t.timestamps
      t.index :project_id, unique: true, name: "index_design_maintenance_calendars_on_project_id"
    end
    add_foreign_key :design_maintenance_calendars, :design_projects, column: :project_id

    execute <<~SQL.squish
      INSERT INTO design_harvest_calendars (project_id, months, created_at, updated_at)
      SELECT project_id, months, created_at, updated_at FROM design_calendars WHERE calendar_type = 'harvest'
    SQL
    execute <<~SQL.squish
      INSERT INTO design_maintenance_calendars (project_id, months, created_at, updated_at)
      SELECT project_id, months, created_at, updated_at FROM design_calendars WHERE calendar_type = 'maintenance'
    SQL

    drop_table :design_calendars
  end
end
