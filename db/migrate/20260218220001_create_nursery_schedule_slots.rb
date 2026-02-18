class CreateNurseryScheduleSlots < ActiveRecord::Migration[7.1]
  def change
    create_table :nursery_schedule_slots do |t|
      t.references :member, null: false, foreign_key: { to_table: :nursery_team_members }
      t.string :member_name, null: false, default: ''
      t.string :member_role, null: false, default: 'employee'
      t.references :nursery, null: false, foreign_key: { to_table: :nursery_nurseries }
      t.string :nursery_name, null: false, default: ''
      t.date :date, null: false
      t.string :start_time, null: false
      t.string :end_time, null: false
      t.string :activity, default: ''
      t.text :notes, default: ''
      t.timestamps
    end
  end
end
