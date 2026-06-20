class DropAcademyAnnouncements < ActiveRecord::Migration[8.1]
  # `academy_announcements` was a vestige of a never-completed feature: no model,
  # association, controller, route, frontend reference, seed or test pointed at it
  # (verified by grep before this migration). We drop the orphan table and its FK.
  def change
    drop_table :academy_announcements do |t|
      t.text "body", default: "", null: false
      t.bigint "created_by_id"
      t.datetime "deleted_at"
      t.datetime "published_at"
      t.string "status", default: "to_confirm", null: false
      t.string "title", default: "", null: false
      t.bigint "training_id", null: false
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["deleted_at"], name: "index_academy_announcements_on_deleted_at"
      t.index ["published_at"], name: "index_academy_announcements_on_published_at"
      t.index ["training_id"], name: "index_academy_announcements_on_training_id"
      t.foreign_key "academy_trainings", column: "training_id"
    end
  end
end
