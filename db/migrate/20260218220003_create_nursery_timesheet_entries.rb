class CreateNurseryTimesheetEntries < ActiveRecord::Migration[7.1]
  def change
    create_table :nursery_timesheet_entries do |t|
      t.references :member, null: false, foreign_key: { to_table: :nursery_team_members }
      t.string :member_name, null: false, default: ''
      t.references :nursery, null: false, foreign_key: { to_table: :nursery_nurseries }
      t.string :nursery_name, null: false, default: ''
      t.date :date, null: false
      t.string :category, null: false, default: 'other'
      t.decimal :hours, precision: 5, scale: 2, null: false, default: 0
      t.text :description, default: ''
      t.timestamps
    end
  end
end
