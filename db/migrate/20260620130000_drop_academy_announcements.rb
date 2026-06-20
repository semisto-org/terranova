class DropAcademyAnnouncements < ActiveRecord::Migration[8.1]
  # `academy_announcements` was a vestige of a never-completed feature: no model,
  # association, controller, route, frontend reference, seed or test pointed at it
  # (verified by grep before this migration). We drop the orphan table and its FK.
  #
  # `if_exists: true` (hotfix) : the table is present in dev/test (loaded from
  # schema.rb) but was NEVER created in production — it had no creating migration
  # (schema.rb drift). Without the guard the drop raised PG::UndefinedTable in
  # prod and CANCELLED every later migration (incl. add kind to design_projects),
  # crashing all Design::Project loads. The guard makes it a safe no-op when absent.
  def change
    drop_table :academy_announcements, if_exists: true do |t|
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
