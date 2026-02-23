# frozen_string_literal: true

class AddTimesheetServiceTypesAndDetails < ActiveRecord::Migration[8.1]
  def change
    create_table :timesheet_service_types do |t|
      t.string :label, null: false
      t.string :default_phase
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :timesheet_service_types, :label, unique: true
    add_index :timesheet_service_types, :deleted_at

    add_column :design_project_timesheets, :details, :string, default: "", null: false
    add_reference :design_project_timesheets, :service_type, foreign_key: { to_table: :timesheet_service_types }, null: true

    add_column :timesheets, :details, :string, default: "", null: false
    add_reference :timesheets, :service_type, foreign_key: { to_table: :timesheet_service_types }, null: true
  end
end
