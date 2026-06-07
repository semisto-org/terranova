class CreateAcademyAnnouncements < ActiveRecord::Migration[8.1]
  def change
    create_table :academy_announcements do |t|
      t.references :training, null: false, foreign_key: { to_table: :academy_trainings }
      t.string :title, null: false, default: ""
      t.text :body, null: false, default: ""
      t.string :status, null: false, default: "to_confirm"
      t.datetime :published_at
      t.bigint :created_by_id
      t.datetime :deleted_at
      t.timestamps
    end
    add_index :academy_announcements, :deleted_at
    add_index :academy_announcements, :published_at
  end
end
