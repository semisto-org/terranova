class CreateNurseryTeamMembers < ActiveRecord::Migration[7.1]
  def change
    create_table :nursery_team_members do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :role, null: false, default: 'employee'
      t.references :nursery, null: false, foreign_key: { to_table: :nursery_nurseries }
      t.string :nursery_name, null: false, default: ''
      t.string :avatar_url, default: ''
      t.string :phone, default: ''
      t.date :start_date, null: false
      t.date :end_date
      t.timestamps
    end
  end
end
