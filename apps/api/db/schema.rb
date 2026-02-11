# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_02_11_223000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "bet_team_memberships", force: :cascade do |t|
    t.bigint "bet_id", null: false
    t.bigint "member_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["bet_id", "member_id"], name: "index_bet_team_memberships_on_bet_id_and_member_id", unique: true
    t.index ["bet_id"], name: "index_bet_team_memberships_on_bet_id"
    t.index ["member_id"], name: "index_bet_team_memberships_on_member_id"
  end

  create_table "bets", force: :cascade do |t|
    t.bigint "pitch_id", null: false
    t.bigint "cycle_id", null: false
    t.string "status", default: "pending", null: false
    t.bigint "placed_by_id"
    t.datetime "placed_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cycle_id"], name: "index_bets_on_cycle_id"
    t.index ["pitch_id"], name: "index_bets_on_pitch_id"
    t.index ["placed_by_id"], name: "index_bets_on_placed_by_id"
  end

  create_table "chowder_items", force: :cascade do |t|
    t.bigint "pitch_id", null: false
    t.bigint "created_by_id"
    t.string "title", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_chowder_items_on_created_by_id"
    t.index ["pitch_id"], name: "index_chowder_items_on_pitch_id"
  end

  create_table "cycles", force: :cascade do |t|
    t.string "name", null: false
    t.date "start_date", null: false
    t.date "end_date", null: false
    t.date "cooldown_start", null: false
    t.date "cooldown_end", null: false
    t.string "status", default: "upcoming", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "event_attendees", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.bigint "member_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id", "member_id"], name: "index_event_attendees_on_event_id_and_member_id", unique: true
    t.index ["event_id"], name: "index_event_attendees_on_event_id"
    t.index ["member_id"], name: "index_event_attendees_on_member_id"
  end

  create_table "events", force: :cascade do |t|
    t.string "title", null: false
    t.string "event_type", null: false
    t.datetime "start_date", null: false
    t.datetime "end_date", null: false
    t.string "location", default: "", null: false
    t.text "description", default: "", null: false
    t.bigint "cycle_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cycle_id"], name: "index_events_on_cycle_id"
  end

  create_table "guild_memberships", force: :cascade do |t|
    t.bigint "guild_id", null: false
    t.bigint "member_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["guild_id", "member_id"], name: "index_guild_memberships_on_guild_id_and_member_id", unique: true
    t.index ["guild_id"], name: "index_guild_memberships_on_guild_id"
    t.index ["member_id"], name: "index_guild_memberships_on_member_id"
  end

  create_table "guilds", force: :cascade do |t|
    t.string "name", null: false
    t.text "description", default: "", null: false
    t.bigint "leader_id"
    t.string "color", default: "blue", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["leader_id"], name: "index_guilds_on_leader_id"
  end

  create_table "hill_chart_snapshots", force: :cascade do |t|
    t.bigint "pitch_id", null: false
    t.jsonb "positions", default: [], null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pitch_id"], name: "index_hill_chart_snapshots_on_pitch_id"
  end

  create_table "idea_items", force: :cascade do |t|
    t.bigint "idea_list_id", null: false
    t.string "title", null: false
    t.integer "votes", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["idea_list_id"], name: "index_idea_items_on_idea_list_id"
  end

  create_table "idea_lists", force: :cascade do |t|
    t.string "name", null: false
    t.text "description", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "member_roles", force: :cascade do |t|
    t.bigint "member_id", null: false
    t.string "role", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["member_id", "role"], name: "index_member_roles_on_member_id_and_role", unique: true
    t.index ["member_id"], name: "index_member_roles_on_member_id"
  end

  create_table "members", force: :cascade do |t|
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "email", null: false
    t.string "avatar", default: "", null: false
    t.string "status", default: "active", null: false
    t.boolean "is_admin", default: false, null: false
    t.date "joined_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_members_on_email", unique: true
  end

  create_table "pitches", force: :cascade do |t|
    t.string "title", null: false
    t.string "status", default: "raw", null: false
    t.string "appetite", null: false
    t.bigint "author_id"
    t.text "problem", null: false
    t.text "solution", null: false
    t.jsonb "rabbit_holes", default: [], null: false
    t.jsonb "no_gos", default: [], null: false
    t.jsonb "breadboard"
    t.text "fat_marker_sketch"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_pitches_on_author_id"
  end

  create_table "scope_tasks", force: :cascade do |t|
    t.bigint "scope_id", null: false
    t.string "title", null: false
    t.boolean "is_nice_to_have", default: false, null: false
    t.boolean "completed", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["scope_id"], name: "index_scope_tasks_on_scope_id"
  end

  create_table "scopes", force: :cascade do |t|
    t.bigint "pitch_id", null: false
    t.string "name", null: false
    t.text "description", default: "", null: false
    t.integer "hill_position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pitch_id"], name: "index_scopes_on_pitch_id"
  end

  create_table "semos_emissions", force: :cascade do |t|
    t.bigint "wallet_id", null: false
    t.integer "amount", null: false
    t.string "reason", null: false
    t.text "description", default: "", null: false
    t.bigint "created_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_semos_emissions_on_created_by_id"
    t.index ["wallet_id"], name: "index_semos_emissions_on_wallet_id"
  end

  create_table "semos_rates", force: :cascade do |t|
    t.string "rate_type", null: false
    t.integer "amount", null: false
    t.text "description", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["rate_type"], name: "index_semos_rates_on_rate_type", unique: true
  end

  create_table "semos_transactions", force: :cascade do |t|
    t.bigint "from_wallet_id", null: false
    t.bigint "to_wallet_id", null: false
    t.integer "amount", null: false
    t.text "description", default: "", null: false
    t.string "transaction_type", default: "transfer", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["from_wallet_id"], name: "index_semos_transactions_on_from_wallet_id"
    t.index ["to_wallet_id"], name: "index_semos_transactions_on_to_wallet_id"
  end

  create_table "timesheets", force: :cascade do |t|
    t.bigint "member_id", null: false
    t.date "date", null: false
    t.decimal "hours", precision: 5, scale: 2, null: false
    t.string "payment_type", null: false
    t.text "description", default: "", null: false
    t.string "category", null: false
    t.boolean "invoiced", default: false, null: false
    t.decimal "kilometers", precision: 8, scale: 2, default: "0.0", null: false
    t.string "project_id"
    t.string "course_id"
    t.bigint "guild_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["guild_id"], name: "index_timesheets_on_guild_id"
    t.index ["member_id"], name: "index_timesheets_on_member_id"
  end

  create_table "wallets", force: :cascade do |t|
    t.bigint "member_id", null: false
    t.integer "balance", default: 0, null: false
    t.integer "floor", default: -50, null: false
    t.integer "ceiling", default: 1000, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["member_id"], name: "index_wallets_on_member_id", unique: true
  end

  add_foreign_key "bet_team_memberships", "bets"
  add_foreign_key "bet_team_memberships", "members"
  add_foreign_key "bets", "cycles"
  add_foreign_key "bets", "members", column: "placed_by_id"
  add_foreign_key "bets", "pitches"
  add_foreign_key "chowder_items", "members", column: "created_by_id"
  add_foreign_key "chowder_items", "pitches"
  add_foreign_key "event_attendees", "events"
  add_foreign_key "event_attendees", "members"
  add_foreign_key "events", "cycles"
  add_foreign_key "guild_memberships", "guilds"
  add_foreign_key "guild_memberships", "members"
  add_foreign_key "guilds", "members", column: "leader_id"
  add_foreign_key "hill_chart_snapshots", "pitches"
  add_foreign_key "idea_items", "idea_lists"
  add_foreign_key "member_roles", "members"
  add_foreign_key "pitches", "members", column: "author_id"
  add_foreign_key "scope_tasks", "scopes"
  add_foreign_key "scopes", "pitches"
  add_foreign_key "semos_emissions", "members", column: "created_by_id"
  add_foreign_key "semos_emissions", "wallets"
  add_foreign_key "semos_transactions", "wallets", column: "from_wallet_id"
  add_foreign_key "semos_transactions", "wallets", column: "to_wallet_id"
  add_foreign_key "timesheets", "guilds"
  add_foreign_key "timesheets", "members"
  add_foreign_key "wallets", "members"
end
