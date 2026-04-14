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

ActiveRecord::Schema[8.1].define(version: 2026_04_14_042616) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pg_trgm"

  create_table "academy_holidays", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_academy_holidays_on_date", unique: true
  end

  create_table "academy_idea_notes", force: :cascade do |t|
    t.string "category", null: false
    t.text "content", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.jsonb "tags", default: [], null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_academy_idea_notes_on_deleted_at"
    t.index ["notion_id"], name: "index_academy_idea_notes_on_notion_id", unique: true
  end

  create_table "academy_participant_categories", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.decimal "deposit_amount", precision: 12, scale: 2, default: "0.0", null: false
    t.string "label", null: false
    t.integer "max_spots", default: 0, null: false
    t.integer "position", default: 0, null: false
    t.decimal "price", precision: 12, scale: 2, default: "0.0", null: false
    t.bigint "training_id", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_academy_participant_categories_on_deleted_at"
    t.index ["training_id"], name: "index_academy_participant_categories_on_training_id"
  end

  create_table "academy_registration_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.decimal "discount_percent", precision: 5, scale: 2, default: "0.0", null: false
    t.bigint "participant_category_id", null: false
    t.integer "quantity", default: 1, null: false
    t.bigint "registration_id", null: false
    t.decimal "subtotal", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "unit_price", precision: 12, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.index ["participant_category_id"], name: "index_academy_registration_items_on_participant_category_id"
    t.index ["registration_id", "participant_category_id"], name: "idx_reg_items_unique", unique: true
    t.index ["registration_id"], name: "index_academy_registration_items_on_registration_id"
  end

  create_table "academy_registration_packs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "pack_id", null: false
    t.integer "quantity", default: 1, null: false
    t.bigint "registration_id", null: false
    t.decimal "subtotal", precision: 12, scale: 2, null: false
    t.decimal "unit_price", precision: 12, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.index ["pack_id"], name: "index_academy_registration_packs_on_pack_id"
    t.index ["registration_id", "pack_id"], name: "idx_reg_packs_on_registration_and_pack", unique: true
    t.index ["registration_id"], name: "index_academy_registration_packs_on_registration_id"
  end

  create_table "academy_settings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "volume_discount_max", precision: 5, scale: 2, default: "30.0", null: false
    t.decimal "volume_discount_per_spot", precision: 5, scale: 2, default: "10.0", null: false
  end

  create_table "academy_training_attendances", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "note", default: "", null: false
    t.bigint "registration_id", null: false
    t.bigint "session_id", null: false
    t.string "status", default: "absent", null: false
    t.datetime "updated_at", null: false
    t.index ["registration_id", "session_id"], name: "idx_academy_attendance_unique_pair", unique: true
    t.index ["registration_id"], name: "index_academy_training_attendances_on_registration_id"
    t.index ["session_id"], name: "index_academy_training_attendances_on_session_id"
  end

  create_table "academy_training_documents", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "name", null: false
    t.bigint "session_id"
    t.bigint "training_id", null: false
    t.datetime "updated_at", null: false
    t.datetime "uploaded_at", null: false
    t.string "uploaded_by", default: "team", null: false
    t.string "url"
    t.index ["deleted_at"], name: "index_academy_training_documents_on_deleted_at"
    t.index ["session_id"], name: "index_academy_training_documents_on_session_id"
    t.index ["training_id"], name: "index_academy_training_documents_on_training_id"
  end

  create_table "academy_training_locations", force: :cascade do |t|
    t.string "address", default: "", null: false
    t.integer "capacity", default: 0, null: false
    t.jsonb "compatible_training_type_ids", default: [], null: false
    t.string "country", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "description", default: "", null: false
    t.boolean "has_accommodation", default: false, null: false
    t.decimal "latitude", precision: 10, scale: 6, default: "0.0", null: false
    t.string "location_type", default: "", null: false
    t.decimal "longitude", precision: 10, scale: 6, default: "0.0", null: false
    t.string "name", null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.jsonb "photo_gallery", default: [], null: false
    t.datetime "updated_at", null: false
    t.string "website_url", default: "", null: false
    t.index ["deleted_at"], name: "index_academy_training_locations_on_deleted_at"
    t.index ["notion_id"], name: "index_academy_training_locations_on_notion_id", unique: true
  end

  create_table "academy_training_pack_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "pack_id", null: false
    t.bigint "participant_category_id", null: false
    t.integer "quantity", default: 1, null: false
    t.datetime "updated_at", null: false
    t.index ["pack_id", "participant_category_id"], name: "idx_pack_items_on_pack_and_category", unique: true
    t.index ["pack_id"], name: "index_academy_training_pack_items_on_pack_id"
    t.index ["participant_category_id"], name: "index_academy_training_pack_items_on_participant_category_id"
  end

  create_table "academy_training_packs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.decimal "deposit_amount", precision: 12, scale: 2, default: "0.0", null: false
    t.string "name", null: false
    t.integer "position", default: 0
    t.decimal "price", precision: 12, scale: 2, null: false
    t.bigint "training_id", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_academy_training_packs_on_deleted_at"
    t.index ["training_id"], name: "index_academy_training_packs_on_training_id"
  end

  create_table "academy_training_registrations", force: :cascade do |t|
    t.decimal "amount_paid", precision: 12, scale: 2, default: "0.0", null: false
    t.string "carpooling", default: "none", null: false
    t.string "contact_email", default: "", null: false
    t.bigint "contact_id"
    t.string "contact_name", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "departure_city", default: "", null: false
    t.string "departure_country", default: "", null: false
    t.string "departure_postal_code", default: "", null: false
    t.text "internal_note", default: "", null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.decimal "payment_amount", precision: 12, scale: 2, default: "0.0", null: false
    t.string "payment_status", default: "pending", null: false
    t.string "phone", default: "", null: false
    t.datetime "registered_at", null: false
    t.string "stripe_payment_intent_id"
    t.bigint "training_id", null: false
    t.datetime "updated_at", null: false
    t.index ["contact_id"], name: "index_academy_training_registrations_on_contact_id"
    t.index ["deleted_at"], name: "index_academy_training_registrations_on_deleted_at"
    t.index ["notion_id"], name: "index_academy_training_registrations_on_notion_id", unique: true
    t.index ["stripe_payment_intent_id"], name: "idx_academy_registrations_stripe_pi", unique: true, where: "(stripe_payment_intent_id IS NOT NULL)"
    t.index ["training_id"], name: "index_academy_training_registrations_on_training_id"
  end

  create_table "academy_training_sessions", force: :cascade do |t|
    t.jsonb "assistant_ids", default: [], null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "description", default: "", null: false
    t.date "end_date", null: false
    t.jsonb "location_ids", default: [], null: false
    t.date "start_date", null: false
    t.string "topic"
    t.jsonb "trainer_ids", default: [], null: false
    t.bigint "training_id", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_academy_training_sessions_on_deleted_at"
    t.index ["training_id"], name: "index_academy_training_sessions_on_training_id"
  end

  create_table "academy_training_types", force: :cascade do |t|
    t.jsonb "checklist_template", default: [], null: false
    t.string "color", default: "#6B7280", null: false
    t.datetime "created_at", null: false
    t.jsonb "default_categories", default: [], null: false
    t.datetime "deleted_at"
    t.text "description", default: "", null: false
    t.string "name", null: false
    t.jsonb "photo_gallery", default: [], null: false
    t.jsonb "trainer_ids", default: [], null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_academy_training_types_on_deleted_at"
  end

  create_table "academy_trainings", force: :cascade do |t|
    t.jsonb "checked_items", default: [], null: false
    t.jsonb "checklist_items", default: [], null: false
    t.text "coordinator_note", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.decimal "deposit_amount", precision: 12, scale: 2, default: "0.0", null: false
    t.text "description", default: "", null: false
    t.jsonb "facilitator_ids", default: [], null: false
    t.text "feedback", default: "", null: false
    t.bigint "location_id"
    t.integer "max_participants", default: 0, null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.string "photo_album_url", default: "", null: false
    t.decimal "price", precision: 12, scale: 2, default: "0.0", null: false
    t.string "private_page_url", default: "", null: false
    t.string "public_page_url", default: "", null: false
    t.string "punchpass_url", default: "", null: false
    t.string "registration_mode", default: "open", null: false
    t.boolean "requires_accommodation", default: false, null: false
    t.string "status", default: "idea", null: false
    t.string "title", null: false
    t.bigint "training_type_id", null: false
    t.datetime "updated_at", null: false
    t.decimal "vat_rate", precision: 5, scale: 2, default: "0.0", null: false
    t.index ["deleted_at"], name: "index_academy_trainings_on_deleted_at"
    t.index ["notion_id"], name: "index_academy_trainings_on_notion_id", unique: true
    t.index ["status"], name: "index_academy_trainings_on_status"
    t.index ["title"], name: "idx_academy_trainings_title_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["training_type_id"], name: "index_academy_trainings_on_training_type_id"
  end

  create_table "actions", force: :cascade do |t|
    t.string "action_type"
    t.string "assignee_name"
    t.datetime "created_at", null: false
    t.date "due_date"
    t.bigint "guild_id"
    t.string "name"
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.bigint "parent_id"
    t.bigint "pole_project_id"
    t.integer "position", default: 0
    t.string "priority"
    t.string "status"
    t.jsonb "tags", default: []
    t.bigint "task_list_id"
    t.integer "time_minutes"
    t.bigint "training_id"
    t.datetime "updated_at", null: false
    t.index ["guild_id"], name: "index_actions_on_guild_id"
    t.index ["notion_id"], name: "index_actions_on_notion_id", unique: true
    t.index ["parent_id"], name: "index_actions_on_parent_id"
    t.index ["pole_project_id"], name: "index_actions_on_pole_project_id"
    t.index ["task_list_id"], name: "index_actions_on_task_list_id"
    t.index ["training_id"], name: "index_actions_on_training_id"
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "album_media_items", force: :cascade do |t|
    t.bigint "album_id", null: false
    t.string "caption", default: ""
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "device_make", default: ""
    t.string "device_model", default: ""
    t.jsonb "exif_data", default: {}
    t.integer "height"
    t.string "media_type", null: false
    t.datetime "taken_at"
    t.datetime "updated_at", null: false
    t.string "uploaded_by", default: "team", null: false
    t.integer "width"
    t.index ["album_id"], name: "index_album_media_items_on_album_id"
    t.index ["deleted_at"], name: "index_album_media_items_on_deleted_at"
    t.index ["taken_at"], name: "index_album_media_items_on_taken_at"
  end

  create_table "albums", force: :cascade do |t|
    t.bigint "albumable_id"
    t.string "albumable_type"
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "description", default: ""
    t.string "status", default: "active", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["albumable_type", "albumable_id"], name: "index_albums_on_albumable_type_and_albumable_id", unique: true, where: "((albumable_type IS NOT NULL) AND (albumable_id IS NOT NULL))"
    t.index ["deleted_at"], name: "index_albums_on_deleted_at"
  end

  create_table "bank_connections", force: :cascade do |t|
    t.string "accounting_scope", default: "general", null: false
    t.string "bank_name", null: false
    t.bigint "connected_by_id", null: false
    t.datetime "consent_expires_at"
    t.datetime "created_at", null: false
    t.string "iban"
    t.string "institution_id"
    t.datetime "last_synced_at"
    t.string "provider", null: false
    t.string "provider_account_id"
    t.string "provider_requisition_id"
    t.string "status", default: "linked", null: false
    t.datetime "updated_at", null: false
    t.index ["accounting_scope"], name: "index_bank_connections_on_accounting_scope"
    t.index ["provider_account_id"], name: "index_bank_connections_on_provider_account_id", unique: true, where: "(provider_account_id IS NOT NULL)"
    t.index ["status"], name: "index_bank_connections_on_status"
  end

  create_table "bank_reconciliations", force: :cascade do |t|
    t.bigint "bank_transaction_id", null: false
    t.string "confidence", default: "manual", null: false
    t.datetime "created_at", null: false
    t.bigint "matched_by_id"
    t.text "notes"
    t.bigint "reconcilable_id", null: false
    t.string "reconcilable_type", null: false
    t.datetime "updated_at", null: false
    t.index ["bank_transaction_id"], name: "index_bank_reconciliations_on_bank_transaction_id", unique: true
    t.index ["reconcilable_type", "reconcilable_id"], name: "idx_bank_reconciliations_on_reconcilable"
  end

  create_table "bank_transactions", force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2, null: false
    t.bigint "bank_connection_id", null: false
    t.date "booking_date"
    t.string "category"
    t.string "counterpart_iban"
    t.string "counterpart_name"
    t.datetime "created_at", null: false
    t.string "currency", default: "EUR", null: false
    t.date "date", null: false
    t.string "internal_reference"
    t.string "provider_transaction_id", null: false
    t.text "remittance_info"
    t.string "status", default: "unmatched", null: false
    t.datetime "updated_at", null: false
    t.index ["bank_connection_id", "date"], name: "index_bank_transactions_on_bank_connection_id_and_date"
    t.index ["bank_connection_id"], name: "index_bank_transactions_on_bank_connection_id"
    t.index ["date"], name: "index_bank_transactions_on_date"
    t.index ["provider_transaction_id"], name: "index_bank_transactions_on_provider_transaction_id", unique: true
    t.index ["status"], name: "index_bank_transactions_on_status"
  end

  create_table "bet_team_memberships", force: :cascade do |t|
    t.bigint "bet_id", null: false
    t.datetime "created_at", null: false
    t.bigint "member_id", null: false
    t.datetime "updated_at", null: false
    t.index ["bet_id", "member_id"], name: "index_bet_team_memberships_on_bet_id_and_member_id", unique: true
    t.index ["bet_id"], name: "index_bet_team_memberships_on_bet_id"
    t.index ["member_id"], name: "index_bet_team_memberships_on_member_id"
  end

  create_table "bets", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "cycle_id", null: false
    t.datetime "deleted_at"
    t.bigint "pitch_id", null: false
    t.datetime "placed_at", null: false
    t.bigint "placed_by_id"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["cycle_id"], name: "index_bets_on_cycle_id"
    t.index ["deleted_at"], name: "index_bets_on_deleted_at"
    t.index ["pitch_id"], name: "index_bets_on_pitch_id"
    t.index ["placed_by_id"], name: "index_bets_on_placed_by_id"
  end

  create_table "billing_config", force: :cascade do |t|
    t.decimal "asbl_support_rate", precision: 5, scale: 4, default: "0.15", null: false
    t.datetime "created_at", null: false
    t.decimal "hourly_rate", precision: 8, scale: 2, default: "60.0", null: false
    t.datetime "updated_at", null: false
  end

  create_table "bucket_transactions", force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2, null: false
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.datetime "deleted_at"
    t.string "description", null: false
    t.string "kind", null: false
    t.bigint "member_id"
    t.string "member_name"
    t.bigint "projectable_id", null: false
    t.string "projectable_type", null: false
    t.bigint "recorded_by_id", null: false
    t.string "recorded_by_name", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_bucket_transactions_on_deleted_at"
    t.index ["kind"], name: "index_bucket_transactions_on_kind"
    t.index ["member_id"], name: "index_bucket_transactions_on_member_id"
    t.index ["projectable_type", "projectable_id"], name: "index_bucket_transactions_on_projectable"
  end

  create_table "chowder_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.datetime "deleted_at"
    t.bigint "pitch_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_chowder_items_on_created_by_id"
    t.index ["deleted_at"], name: "index_chowder_items_on_deleted_at"
    t.index ["pitch_id"], name: "index_chowder_items_on_pitch_id"
  end

  create_table "contact_tags", force: :cascade do |t|
    t.bigint "contact_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["contact_id", "name"], name: "index_contact_tags_on_contact_id_and_name", unique: true
    t.index ["contact_id"], name: "index_contact_tags_on_contact_id"
    t.index ["name"], name: "index_contact_tags_on_name"
  end

  create_table "contacts", force: :cascade do |t|
    t.text "address", default: ""
    t.text "bio", default: "", null: false
    t.string "city", default: "", null: false
    t.string "contact_type", default: "person", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "email", default: ""
    t.jsonb "expertise", default: [], null: false
    t.decimal "latitude", precision: 10, scale: 6
    t.string "linkedin_url", default: "", null: false
    t.decimal "longitude", precision: 10, scale: 6
    t.string "name", null: false
    t.boolean "newsletter_subscribed", default: false, null: false
    t.text "notes", default: ""
    t.text "notes_html", default: ""
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.bigint "organization_id"
    t.string "organization_type", default: ""
    t.string "phone", default: ""
    t.string "position", default: "", null: false
    t.string "region", default: "", null: false
    t.jsonb "teams", default: [], null: false
    t.datetime "updated_at", null: false
    t.boolean "visible_in_directory", default: false, null: false
    t.index ["contact_type"], name: "index_contacts_on_contact_type"
    t.index ["deleted_at"], name: "index_contacts_on_deleted_at"
    t.index ["name"], name: "idx_contacts_name_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["name"], name: "index_contacts_on_name"
    t.index ["notion_id"], name: "index_contacts_on_notion_id", unique: true
    t.index ["organization_id"], name: "index_contacts_on_organization_id"
  end

  create_table "credentials", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.bigint "guild_id", null: false
    t.text "notes"
    t.string "password"
    t.string "service_name", null: false
    t.datetime "updated_at", null: false
    t.string "url"
    t.string "username"
    t.index ["created_by_id"], name: "index_credentials_on_created_by_id"
    t.index ["guild_id"], name: "index_credentials_on_guild_id"
  end

  create_table "cycle_periods", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "color", default: "#5B5781", null: false
    t.date "cooldown_ends_on", null: false
    t.date "cooldown_starts_on", null: false
    t.datetime "created_at", null: false
    t.date "ends_on", null: false
    t.string "name", null: false
    t.text "notes"
    t.date "starts_on", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_cycle_periods_on_active"
    t.index ["starts_on"], name: "index_cycle_periods_on_starts_on"
  end

  create_table "cycles", force: :cascade do |t|
    t.date "cooldown_end", null: false
    t.date "cooldown_start", null: false
    t.datetime "created_at", null: false
    t.date "end_date", null: false
    t.string "name", null: false
    t.date "start_date", null: false
    t.string "status", default: "upcoming", null: false
    t.datetime "updated_at", null: false
  end

  create_table "design_annotations", force: :cascade do |t|
    t.string "author_id", null: false
    t.string "author_name", null: false
    t.string "author_type", null: false
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "document_id", null: false
    t.bigint "project_id", null: false
    t.boolean "resolved", default: false, null: false
    t.datetime "updated_at", null: false
    t.decimal "x", precision: 8, scale: 4, null: false
    t.decimal "y", precision: 8, scale: 4, null: false
    t.index ["deleted_at"], name: "index_design_annotations_on_deleted_at"
    t.index ["project_id"], name: "index_design_annotations_on_project_id"
  end

  create_table "design_client_contributions", force: :cascade do |t|
    t.string "client_id", null: false
    t.datetime "created_at", null: false
    t.jsonb "plant_journal", default: [], null: false
    t.bigint "project_id", null: false
    t.jsonb "terrain_questionnaire", default: {}, null: false
    t.datetime "updated_at", null: false
    t.jsonb "wishlist", default: [], null: false
    t.index ["project_id"], name: "index_design_client_contributions_on_project_id", unique: true
  end

  create_table "design_follow_up_visits", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.text "notes", default: "", null: false
    t.jsonb "photos", default: [], null: false
    t.bigint "project_id", null: false
    t.datetime "updated_at", null: false
    t.string "visit_type", null: false
    t.index ["project_id"], name: "index_design_follow_up_visits_on_project_id"
  end

  create_table "design_harvest_calendars", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "months", default: [], null: false
    t.bigint "project_id", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_design_harvest_calendars_on_project_id", unique: true
  end

  create_table "design_interventions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.string "intervention_type", null: false
    t.text "notes", default: "", null: false
    t.bigint "plant_record_id"
    t.bigint "project_id", null: false
    t.datetime "updated_at", null: false
    t.index ["plant_record_id"], name: "index_design_interventions_on_plant_record_id"
    t.index ["project_id"], name: "index_design_interventions_on_project_id"
  end

  create_table "design_maintenance_calendars", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "months", default: [], null: false
    t.bigint "project_id", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_design_maintenance_calendars_on_project_id", unique: true
  end

  create_table "design_media_items", force: :cascade do |t|
    t.string "caption", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "media_type", null: false
    t.bigint "project_id", null: false
    t.datetime "taken_at", null: false
    t.string "thumbnail_url", default: "", null: false
    t.datetime "updated_at", null: false
    t.datetime "uploaded_at", null: false
    t.string "uploaded_by", default: "team", null: false
    t.string "url", null: false
    t.index ["deleted_at"], name: "index_design_media_items_on_deleted_at"
    t.index ["project_id"], name: "index_design_media_items_on_project_id"
  end

  create_table "design_plant_markers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.integer "diameter_cm"
    t.integer "number", null: false
    t.bigint "palette_item_id"
    t.bigint "planting_plan_id", null: false
    t.string "species_name", null: false
    t.datetime "updated_at", null: false
    t.decimal "x", precision: 8, scale: 4, null: false
    t.decimal "y", precision: 8, scale: 4, null: false
    t.index ["deleted_at"], name: "index_design_plant_markers_on_deleted_at"
    t.index ["palette_item_id"], name: "index_design_plant_markers_on_palette_item_id"
    t.index ["planting_plan_id", "number"], name: "idx_design_plant_markers_number_per_plan", unique: true
    t.index ["planting_plan_id"], name: "index_design_plant_markers_on_planting_plan_id"
  end

  create_table "design_plant_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "health_score", default: 100, null: false
    t.bigint "marker_id"
    t.text "notes", default: "", null: false
    t.bigint "palette_item_id"
    t.bigint "project_id", null: false
    t.string "status", default: "alive", null: false
    t.datetime "updated_at", null: false
    t.index ["marker_id"], name: "index_design_plant_records_on_marker_id"
    t.index ["palette_item_id"], name: "index_design_plant_records_on_palette_item_id"
    t.index ["project_id"], name: "index_design_plant_records_on_project_id"
  end

  create_table "design_planting_plans", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "image_url", default: "", null: false
    t.string "layout", default: "split-3-4-1-4", null: false
    t.bigint "project_id", null: false
    t.jsonb "scale_data"
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_design_planting_plans_on_project_id", unique: true
  end

  create_table "design_project_documents", force: :cascade do |t|
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "name", null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.string "phase", default: "", null: false
    t.bigint "project_id"
    t.bigint "size", default: 0, null: false
    t.datetime "updated_at", null: false
    t.datetime "uploaded_at", null: false
    t.string "uploaded_by", default: "team", null: false
    t.string "url", null: false
    t.index ["deleted_at"], name: "index_design_project_documents_on_deleted_at"
    t.index ["name"], name: "idx_design_project_documents_name_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["notion_id"], name: "index_design_project_documents_on_notion_id", unique: true
    t.index ["project_id"], name: "index_design_project_documents_on_project_id"
  end

  create_table "design_project_meetings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.integer "duration_minutes", default: 60, null: false
    t.string "location", default: "", null: false
    t.bigint "project_id", null: false
    t.datetime "starts_at", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_design_project_meetings_on_deleted_at"
    t.index ["project_id"], name: "index_design_project_meetings_on_project_id"
    t.index ["starts_at"], name: "index_design_project_meetings_on_starts_at"
  end

  create_table "design_project_palette_items", force: :cascade do |t|
    t.string "common_name", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.jsonb "harvest_months", default: [], null: false
    t.jsonb "harvest_products", default: [], null: false
    t.string "layer", null: false
    t.text "notes", default: "", null: false
    t.bigint "palette_id", null: false
    t.integer "quantity", default: 1, null: false
    t.string "species_id", null: false
    t.string "species_name", null: false
    t.decimal "unit_price", precision: 10, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.string "variety_id"
    t.string "variety_name"
    t.index ["deleted_at"], name: "index_design_project_palette_items_on_deleted_at"
    t.index ["palette_id"], name: "index_design_project_palette_items_on_palette_id"
  end

  create_table "design_project_palettes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "project_id", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_design_project_palettes_on_project_id", unique: true
  end

  create_table "design_project_templates", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "default_phases", default: [], null: false
    t.text "description", default: "", null: false
    t.string "name", null: false
    t.decimal "suggested_budget", precision: 12, scale: 2, default: "0.0", null: false
    t.integer "suggested_hours", default: 0, null: false
    t.datetime "updated_at", null: false
  end

  create_table "design_project_timesheets", force: :cascade do |t|
    t.boolean "billed", default: false, null: false
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.datetime "deleted_at"
    t.string "details", default: "", null: false
    t.decimal "hours", precision: 5, scale: 2, default: "0.0", null: false
    t.string "member_id", null: false
    t.string "member_name", null: false
    t.string "mode", null: false
    t.text "notes", default: "", null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.string "phase", null: false
    t.bigint "project_id", null: false
    t.bigint "service_type_id"
    t.bigint "training_id"
    t.integer "travel_km", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_design_project_timesheets_on_deleted_at"
    t.index ["notion_id"], name: "index_design_project_timesheets_on_notion_id", unique: true
    t.index ["project_id"], name: "index_design_project_timesheets_on_project_id"
    t.index ["service_type_id"], name: "index_design_project_timesheets_on_service_type_id"
  end

  create_table "design_projects", force: :cascade do |t|
    t.string "acquisition_channel"
    t.integer "area", default: 0, null: false
    t.string "city", default: "", null: false
    t.string "client_email", default: "", null: false
    t.string "client_id", null: false
    t.jsonb "client_interests", default: [], null: false
    t.string "client_name", null: false
    t.string "client_phone", default: "", null: false
    t.string "client_portal_token", limit: 16
    t.string "country_name", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.decimal "expenses_actual", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "expenses_budget", precision: 12, scale: 2, default: "0.0", null: false
    t.string "google_photos_url", default: "", null: false
    t.integer "hours_billed", default: 0, null: false
    t.integer "hours_planned", default: 0, null: false
    t.integer "hours_semos", default: 0, null: false
    t.integer "hours_worked", default: 0, null: false
    t.decimal "latitude", precision: 10, scale: 6, default: "0.0", null: false
    t.decimal "longitude", precision: 10, scale: 6, default: "0.0", null: false
    t.string "name", null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.string "number", default: "", null: false
    t.string "phase", default: "offre", null: false
    t.string "place_id", default: "", null: false
    t.date "planting_date"
    t.string "postcode", default: "", null: false
    t.string "project_manager_id", default: "", null: false
    t.string "project_type", default: "", null: false
    t.date "start_date"
    t.string "status", default: "pending", null: false
    t.string "street", default: "", null: false
    t.bigint "template_id"
    t.datetime "updated_at", null: false
    t.string "website_url", default: "", null: false
    t.index ["client_portal_token"], name: "index_design_projects_on_client_portal_token", unique: true
    t.index ["deleted_at"], name: "index_design_projects_on_deleted_at"
    t.index ["name"], name: "idx_design_projects_name_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["notion_id"], name: "index_design_projects_on_notion_id", unique: true
    t.index ["phase"], name: "index_design_projects_on_phase"
    t.index ["status"], name: "index_design_projects_on_status"
    t.index ["template_id"], name: "index_design_projects_on_template_id"
    t.index ["updated_at"], name: "index_design_projects_on_updated_at"
  end

  create_table "design_quote_lines", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "description", null: false
    t.decimal "quantity", precision: 10, scale: 2, default: "1.0", null: false
    t.bigint "quote_id", null: false
    t.decimal "total", precision: 12, scale: 2, default: "0.0", null: false
    t.string "unit", default: "u", null: false
    t.decimal "unit_price", precision: 12, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_design_quote_lines_on_deleted_at"
    t.index ["quote_id"], name: "index_design_quote_lines_on_quote_id"
  end

  create_table "design_quotes", force: :cascade do |t|
    t.date "accepted_at"
    t.datetime "approved_at"
    t.string "approved_by"
    t.string "author_name", default: "", null: false
    t.text "client_comment"
    t.bigint "contact_id"
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.bigint "project_id"
    t.date "sent_at"
    t.string "status", default: "draft", null: false
    t.decimal "subtotal", precision: 12, scale: 2, default: "0.0", null: false
    t.string "title", null: false
    t.decimal "total", precision: 12, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.date "valid_until", null: false
    t.decimal "vat_amount", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "vat_rate", precision: 5, scale: 2, default: "21.0", null: false
    t.integer "version", default: 1, null: false
    t.index ["deleted_at"], name: "index_design_quotes_on_deleted_at"
    t.index ["notion_id"], name: "index_design_quotes_on_notion_id", unique: true
    t.index ["project_id"], name: "index_design_quotes_on_project_id"
  end

  create_table "design_site_analyses", force: :cascade do |t|
    t.jsonb "access_data", default: {}, null: false
    t.jsonb "aesthetics", default: {}, null: false
    t.jsonb "buildings", default: {}, null: false
    t.jsonb "client_observations", default: {}, null: false
    t.jsonb "client_photos", default: [], null: false
    t.jsonb "client_usage_map", default: [], null: false
    t.jsonb "climate", default: {}, null: false
    t.datetime "created_at", null: false
    t.jsonb "geomorphology", default: {}, null: false
    t.jsonb "microclimate", default: {}, null: false
    t.bigint "project_id", null: false
    t.jsonb "socio_economic", default: {}, null: false
    t.jsonb "soil", default: {}, null: false
    t.datetime "updated_at", null: false
    t.jsonb "vegetation", default: {}, null: false
    t.jsonb "water", default: {}, null: false
    t.boolean "water_access"
    t.jsonb "zoning", default: {}, null: false
    t.jsonb "zoning_categories", default: [], null: false
    t.index ["project_id"], name: "index_design_site_analyses_on_project_id", unique: true
  end

  create_table "design_team_members", force: :cascade do |t|
    t.datetime "assigned_at", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.boolean "is_paid", default: false, null: false
    t.string "member_avatar", default: "", null: false
    t.string "member_email", default: "", null: false
    t.string "member_id", null: false
    t.string "member_name", null: false
    t.bigint "project_id", null: false
    t.string "role", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_design_team_members_on_deleted_at"
    t.index ["project_id", "member_id", "role"], name: "idx_design_team_member_unique_role", unique: true
    t.index ["project_id"], name: "index_design_team_members_on_project_id"
  end

  create_table "economic_inputs", force: :cascade do |t|
    t.integer "amount_cents", default: 0, null: false
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.bigint "design_project_id"
    t.string "labor_type"
    t.bigint "location_id"
    t.text "notes"
    t.decimal "quantity", precision: 10, scale: 2, default: "0.0", null: false
    t.string "unit", null: false
    t.datetime "updated_at", null: false
    t.bigint "zone_id"
    t.index ["category"], name: "index_economic_inputs_on_category"
    t.index ["date"], name: "index_economic_inputs_on_date"
    t.index ["design_project_id"], name: "index_economic_inputs_on_design_project_id"
    t.index ["labor_type"], name: "index_economic_inputs_on_labor_type"
    t.index ["location_id"], name: "index_economic_inputs_on_location_id"
    t.index ["zone_id"], name: "index_economic_inputs_on_zone_id"
  end

  create_table "economic_outputs", force: :cascade do |t|
    t.integer "amount_cents"
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.bigint "design_project_id"
    t.bigint "location_id"
    t.text "notes"
    t.decimal "quantity", precision: 10, scale: 2, default: "0.0", null: false
    t.bigint "species_id"
    t.string "species_name"
    t.string "unit", null: false
    t.datetime "updated_at", null: false
    t.bigint "zone_id"
    t.index ["category"], name: "index_economic_outputs_on_category"
    t.index ["date"], name: "index_economic_outputs_on_date"
    t.index ["design_project_id"], name: "index_economic_outputs_on_design_project_id"
    t.index ["location_id"], name: "index_economic_outputs_on_location_id"
    t.index ["species_id"], name: "index_economic_outputs_on_species_id"
    t.index ["zone_id"], name: "index_economic_outputs_on_zone_id"
  end

  create_table "event_attendees", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "event_id", null: false
    t.bigint "member_id", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id", "member_id"], name: "index_event_attendees_on_event_id_and_member_id", unique: true
    t.index ["event_id"], name: "index_event_attendees_on_event_id"
    t.index ["member_id"], name: "index_event_attendees_on_member_id"
  end

  create_table "event_types", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "label", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_event_types_on_deleted_at"
    t.index ["label"], name: "index_event_types_on_label", unique: true
  end

  create_table "events", force: :cascade do |t|
    t.boolean "all_day", default: false, null: false
    t.datetime "created_at", null: false
    t.bigint "cycle_id"
    t.datetime "deleted_at"
    t.text "description", default: "", null: false
    t.datetime "end_date", null: false
    t.bigint "event_type_id", null: false
    t.string "location", default: "", null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.bigint "projectable_id"
    t.string "projectable_type"
    t.datetime "start_date", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["cycle_id"], name: "index_events_on_cycle_id"
    t.index ["deleted_at"], name: "index_events_on_deleted_at"
    t.index ["event_type_id"], name: "index_events_on_event_type_id"
    t.index ["notion_id"], name: "index_events_on_notion_id", unique: true
    t.index ["projectable_type", "projectable_id"], name: "index_events_on_projectable"
  end

  create_table "expense_note_lines", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "expense_note_id", null: false
    t.string "label", null: false
    t.integer "line_total_cents", default: 0, null: false
    t.integer "position", default: 0, null: false
    t.decimal "quantity", precision: 10, scale: 2, default: "1.0", null: false
    t.integer "unit_amount_cents", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["expense_note_id"], name: "index_expense_note_lines_on_expense_note_id"
  end

  create_table "expense_notes", force: :cascade do |t|
    t.bigint "contact_id", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.date "note_date", null: false
    t.text "notes"
    t.string "number", null: false
    t.bigint "organization_id", null: false
    t.string "status", default: "draft", null: false
    t.string "subject", null: false
    t.integer "total_cents", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["contact_id"], name: "index_expense_notes_on_contact_id"
    t.index ["deleted_at"], name: "index_expense_notes_on_deleted_at"
    t.index ["number"], name: "index_expense_notes_on_number", unique: true
    t.index ["organization_id"], name: "index_expense_notes_on_organization_id"
    t.index ["status"], name: "index_expense_notes_on_status"
  end

  create_table "expenses", force: :cascade do |t|
    t.decimal "amount_excl_vat", precision: 12, scale: 2, default: "0.0", null: false
    t.boolean "billable_to_client", default: false, null: false
    t.string "billing_zone"
    t.string "category"
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.decimal "eu_vat_amount", precision: 12, scale: 2, default: "0.0", null: false
    t.string "eu_vat_rate"
    t.string "expense_type", null: false
    t.date "invoice_date"
    t.text "name", default: "", null: false
    t.text "notes", default: "", null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.string "paid_by"
    t.date "payment_date"
    t.string "payment_type"
    t.string "poles", default: [], array: true
    t.bigint "projectable_id"
    t.string "projectable_type"
    t.string "rebilling_status"
    t.boolean "reimbursed", default: false, null: false
    t.date "reimbursement_date"
    t.string "status", default: "processing", null: false
    t.string "supplier"
    t.bigint "supplier_contact_id"
    t.decimal "total_incl_vat", precision: 12, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.decimal "vat_12", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "vat_21", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "vat_6", precision: 12, scale: 2, default: "0.0", null: false
    t.string "vat_rate"
    t.index ["deleted_at"], name: "index_expenses_on_deleted_at"
    t.index ["invoice_date"], name: "index_expenses_on_invoice_date"
    t.index ["notion_id"], name: "index_expenses_on_notion_id", unique: true
    t.index ["projectable_type", "projectable_id"], name: "index_expenses_on_projectable"
    t.index ["supplier_contact_id"], name: "index_expenses_on_supplier_contact_id"
  end

  create_table "guild_documents", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "guild_id", null: false
    t.string "name", null: false
    t.jsonb "tags", default: []
    t.datetime "updated_at", null: false
    t.bigint "uploaded_by_id"
    t.index ["guild_id"], name: "index_guild_documents_on_guild_id"
    t.index ["uploaded_by_id"], name: "index_guild_documents_on_uploaded_by_id"
  end

  create_table "guilds", force: :cascade do |t|
    t.string "color", default: "blue", null: false
    t.datetime "created_at", null: false
    t.text "description", default: "", null: false
    t.string "guild_type", default: "network", null: false
    t.string "icon"
    t.bigint "lab_id"
    t.bigint "leader_id"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["guild_type"], name: "index_guilds_on_guild_type"
    t.index ["lab_id"], name: "index_guilds_on_lab_id"
    t.index ["leader_id"], name: "index_guilds_on_leader_id"
  end

  create_table "hill_chart_snapshots", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "pitch_id", null: false
    t.jsonb "positions", default: [], null: false
    t.datetime "updated_at", null: false
    t.index ["pitch_id"], name: "index_hill_chart_snapshots_on_pitch_id"
  end

  create_table "idea_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "idea_list_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "votes", default: 0, null: false
    t.index ["idea_list_id"], name: "index_idea_items_on_idea_list_id"
  end

  create_table "idea_lists", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description", default: "", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
  end

  create_table "knowledge_bookmarks", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "topic_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["topic_id"], name: "index_knowledge_bookmarks_on_topic_id"
    t.index ["user_id", "topic_id"], name: "index_knowledge_bookmarks_on_user_id_and_topic_id", unique: true
    t.index ["user_id"], name: "index_knowledge_bookmarks_on_user_id"
  end

  create_table "knowledge_comments", force: :cascade do |t|
    t.string "author_name"
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.bigint "topic_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["topic_id"], name: "index_knowledge_comments_on_topic_id"
    t.index ["user_id"], name: "index_knowledge_comments_on_user_id"
  end

  create_table "knowledge_sections", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.text "description"
    t.string "name", null: false
    t.integer "position", default: 0
    t.bigint "projectable_id"
    t.string "projectable_type"
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_knowledge_sections_on_created_by_id"
    t.index ["projectable_type", "projectable_id", "name"], name: "index_knowledge_sections_on_projectable_and_name", unique: true
    t.index ["projectable_type", "projectable_id"], name: "index_knowledge_sections_on_projectable"
  end

  create_table "knowledge_topic_editors", force: :cascade do |t|
    t.datetime "edited_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.bigint "topic_id", null: false
    t.bigint "user_id", null: false
    t.index ["topic_id", "user_id"], name: "index_knowledge_topic_editors_on_topic_id_and_user_id", unique: true
    t.index ["topic_id"], name: "index_knowledge_topic_editors_on_topic_id"
    t.index ["user_id"], name: "index_knowledge_topic_editors_on_user_id"
  end

  create_table "knowledge_topic_revisions", force: :cascade do |t|
    t.json "changes_data", default: {}
    t.datetime "created_at", null: false
    t.bigint "topic_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.string "user_name"
    t.index ["topic_id"], name: "index_knowledge_topic_revisions_on_topic_id"
    t.index ["user_id"], name: "index_knowledge_topic_revisions_on_user_id"
  end

  create_table "knowledge_topics", force: :cascade do |t|
    t.string "author_name"
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.boolean "pinned", default: false
    t.integer "reading_time_minutes", default: 1
    t.bigint "section_id"
    t.string "source_url"
    t.string "status", default: "draft", null: false
    t.json "tags", default: []
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_knowledge_topics_on_created_by_id"
    t.index ["notion_id"], name: "index_knowledge_topics_on_notion_id", unique: true
    t.index ["pinned"], name: "index_knowledge_topics_on_pinned"
    t.index ["section_id"], name: "index_knowledge_topics_on_section_id"
    t.index ["status"], name: "index_knowledge_topics_on_status"
    t.index ["title"], name: "idx_knowledge_topics_title_trgm", opclass: :gin_trgm_ops, using: :gin
  end

  create_table "lab_memberships", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "lab_id", null: false
    t.bigint "member_id", null: false
    t.datetime "updated_at", null: false
    t.index ["lab_id", "member_id"], name: "index_lab_memberships_on_lab_id_and_member_id", unique: true
    t.index ["lab_id"], name: "index_lab_memberships_on_lab_id"
    t.index ["member_id"], name: "index_lab_memberships_on_member_id"
  end

  create_table "labs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_labs_on_slug", unique: true
  end

  create_table "location_zones", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "location_id"
    t.string "name", null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.datetime "updated_at", null: false
    t.index ["location_id"], name: "index_location_zones_on_location_id"
    t.index ["notion_id"], name: "index_location_zones_on_notion_id", unique: true
  end

  create_table "locations", force: :cascade do |t|
    t.string "address"
    t.string "country"
    t.datetime "created_at", null: false
    t.decimal "latitude", precision: 10, scale: 6
    t.string "location_type"
    t.decimal "longitude", precision: 10, scale: 6
    t.string "name", null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.datetime "updated_at", null: false
    t.string "website_url"
    t.index ["notion_id"], name: "index_locations_on_notion_id", unique: true
  end

  create_table "marketplace_listings", force: :cascade do |t|
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "description", default: "", null: false
    t.bigint "member_id", null: false
    t.integer "price_semos", null: false
    t.string "status", default: "active", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_marketplace_listings_on_category"
    t.index ["member_id"], name: "index_marketplace_listings_on_member_id"
    t.index ["status", "deleted_at"], name: "index_marketplace_listings_on_status_and_deleted_at"
  end

  create_table "member_roles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "member_id", null: false
    t.string "role", null: false
    t.datetime "updated_at", null: false
    t.index ["member_id", "role"], name: "index_member_roles_on_member_id_and_role", unique: true
    t.index ["member_id"], name: "index_member_roles_on_member_id"
  end

  create_table "members", force: :cascade do |t|
    t.string "avatar", default: "", null: false
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "first_name", null: false
    t.boolean "is_admin", default: false, null: false
    t.date "joined_at", null: false
    t.datetime "last_activity_at"
    t.string "last_name", null: false
    t.string "member_kind", default: "human", null: false
    t.string "membership_type", default: "effective", null: false
    t.string "password_digest"
    t.string "slack_user_id"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_members_on_email", unique: true
  end

  create_table "notes", force: :cascade do |t|
    t.boolean "archived", default: false
    t.string "author_name"
    t.text "body"
    t.datetime "created_at", null: false
    t.string "note_type"
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.bigint "pole_project_id"
    t.jsonb "tags", default: []
    t.string "title"
    t.datetime "updated_at", null: false
    t.string "url"
    t.index ["notion_id"], name: "index_notes_on_notion_id", unique: true
    t.index ["pole_project_id"], name: "index_notes_on_pole_project_id"
    t.index ["title"], name: "idx_notes_title_trgm", opclass: :gin_trgm_ops, using: :gin
  end

  create_table "notion_assets", force: :cascade do |t|
    t.bigint "attachable_id"
    t.string "attachable_type"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.datetime "downloaded_at"
    t.string "filename"
    t.bigint "notion_record_id"
    t.string "notion_url"
    t.string "original_url"
    t.string "property_name"
    t.string "source_id"
    t.string "source_type"
    t.datetime "updated_at", null: false
    t.index ["attachable_type", "attachable_id"], name: "index_notion_assets_on_attachable_type_and_attachable_id"
    t.index ["notion_record_id"], name: "index_notion_assets_on_notion_record_id"
    t.index ["notion_url"], name: "index_notion_assets_on_notion_url"
    t.index ["source_id"], name: "index_notion_assets_on_source_id"
  end

  create_table "notion_records", force: :cascade do |t|
    t.text "content"
    t.text "content_html"
    t.datetime "created_at", null: false
    t.string "database_id", null: false
    t.string "database_name", null: false
    t.string "notion_id", null: false
    t.jsonb "properties", default: {}
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["database_name"], name: "index_notion_records_on_database_name"
    t.index ["notion_id"], name: "index_notion_records_on_notion_id", unique: true
    t.index ["title"], name: "idx_notion_records_title_trgm", opclass: :gin_trgm_ops, using: :gin
  end

  create_table "nursery_containers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description", default: "", null: false
    t.string "name", null: false
    t.string "short_name", null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "updated_at", null: false
    t.decimal "volume_liters", precision: 7, scale: 2
  end

  create_table "nursery_documentation_entries", force: :cascade do |t|
    t.string "author_id", null: false
    t.string "author_name", null: false
    t.text "content", default: ""
    t.datetime "created_at", null: false
    t.string "entry_type", default: "journal", null: false
    t.bigint "nursery_id"
    t.string "nursery_name", default: ""
    t.datetime "published_at", null: false
    t.jsonb "tags", default: [], null: false
    t.string "thumbnail_url", default: ""
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "video_url", default: ""
    t.index ["nursery_id"], name: "index_nursery_documentation_entries_on_nursery_id"
  end

  create_table "nursery_mother_plants", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "last_harvest_date"
    t.string "member_id", default: "", null: false
    t.string "member_name", default: "", null: false
    t.text "notes", default: "", null: false
    t.string "place_address", default: "", null: false
    t.string "place_id", default: "", null: false
    t.string "place_name", default: "", null: false
    t.date "planting_date", null: false
    t.string "project_id", default: "", null: false
    t.string "project_name", default: "", null: false
    t.integer "quantity", default: 0, null: false
    t.string "source", default: "member-proposal", null: false
    t.string "species_id", null: false
    t.string "species_name", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.datetime "validated_at"
    t.string "validated_by", default: "", null: false
    t.string "variety_id", default: "", null: false
    t.string "variety_name", default: "", null: false
  end

  create_table "nursery_nurseries", force: :cascade do |t|
    t.string "address", default: "", null: false
    t.string "city", default: "", null: false
    t.string "contact_email", default: "", null: false
    t.string "contact_name", default: "", null: false
    t.string "contact_phone", default: "", null: false
    t.string "country", default: "", null: false
    t.datetime "created_at", null: false
    t.text "description", default: "", null: false
    t.string "integration", default: "platform", null: false
    t.boolean "is_pickup_point", default: true, null: false
    t.decimal "latitude", precision: 10, scale: 6, default: "0.0", null: false
    t.decimal "longitude", precision: 10, scale: 6, default: "0.0", null: false
    t.string "name", null: false
    t.string "nursery_type", default: "semisto", null: false
    t.string "postal_code", default: "", null: false
    t.jsonb "specialties", default: [], null: false
    t.datetime "updated_at", null: false
    t.string "website", default: "", null: false
  end

  create_table "nursery_order_lines", force: :cascade do |t|
    t.string "container_name", null: false
    t.datetime "created_at", null: false
    t.bigint "nursery_id", null: false
    t.string "nursery_name", null: false
    t.bigint "order_id", null: false
    t.boolean "pay_in_semos", default: false, null: false
    t.integer "quantity", default: 0, null: false
    t.string "species_name", null: false
    t.bigint "stock_batch_id", null: false
    t.decimal "total_euros", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "total_semos", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "unit_price_euros", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "unit_price_semos", precision: 12, scale: 2
    t.datetime "updated_at", null: false
    t.string "variety_name", default: "", null: false
    t.index ["nursery_id"], name: "index_nursery_order_lines_on_nursery_id"
    t.index ["order_id"], name: "index_nursery_order_lines_on_order_id"
    t.index ["stock_batch_id"], name: "index_nursery_order_lines_on_stock_batch_id"
  end

  create_table "nursery_orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "customer_email", default: "", null: false
    t.string "customer_id", default: "", null: false
    t.string "customer_name", null: false
    t.string "customer_phone", default: "", null: false
    t.boolean "is_member", default: false, null: false
    t.text "notes", default: "", null: false
    t.string "order_number", null: false
    t.datetime "picked_up_at"
    t.bigint "pickup_nursery_id", null: false
    t.datetime "prepared_at"
    t.string "price_level", default: "standard", null: false
    t.datetime "ready_at"
    t.string "status", default: "new", null: false
    t.decimal "subtotal_euros", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "subtotal_semos", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "total_euros", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "total_semos", precision: 12, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.index ["order_number"], name: "index_nursery_orders_on_order_number", unique: true
    t.index ["pickup_nursery_id"], name: "index_nursery_orders_on_pickup_nursery_id"
    t.index ["status"], name: "index_nursery_orders_on_status"
  end

  create_table "nursery_schedule_slots", force: :cascade do |t|
    t.string "activity", default: ""
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.string "end_time", null: false
    t.bigint "member_id", null: false
    t.string "member_name", default: "", null: false
    t.string "member_role", default: "employee", null: false
    t.text "notes", default: ""
    t.bigint "nursery_id", null: false
    t.string "nursery_name", default: "", null: false
    t.string "start_time", null: false
    t.datetime "updated_at", null: false
    t.index ["member_id"], name: "index_nursery_schedule_slots_on_member_id"
    t.index ["nursery_id"], name: "index_nursery_schedule_slots_on_nursery_id"
  end

  create_table "nursery_stock_batches", force: :cascade do |t|
    t.boolean "accepts_semos", default: false, null: false
    t.integer "available_quantity", default: 0, null: false
    t.bigint "container_id", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "growth_stage", default: "young", null: false
    t.text "notes", default: "", null: false
    t.bigint "nursery_id", null: false
    t.string "origin", default: "", null: false
    t.decimal "price_euros", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "price_semos", precision: 12, scale: 2
    t.integer "quantity", default: 0, null: false
    t.integer "reserved_quantity", default: 0, null: false
    t.date "sowing_date"
    t.string "species_id", null: false
    t.string "species_name", null: false
    t.datetime "updated_at", null: false
    t.string "variety_id", default: "", null: false
    t.string "variety_name", default: "", null: false
    t.index ["container_id"], name: "index_nursery_stock_batches_on_container_id"
    t.index ["deleted_at"], name: "index_nursery_stock_batches_on_deleted_at"
    t.index ["nursery_id"], name: "index_nursery_stock_batches_on_nursery_id"
  end

  create_table "nursery_team_members", force: :cascade do |t|
    t.string "avatar_url", default: ""
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.date "end_date"
    t.string "name", null: false
    t.bigint "nursery_id", null: false
    t.string "nursery_name", default: "", null: false
    t.string "phone", default: ""
    t.string "role", default: "employee", null: false
    t.date "start_date", null: false
    t.datetime "updated_at", null: false
    t.index ["nursery_id"], name: "index_nursery_team_members_on_nursery_id"
  end

  create_table "nursery_timesheet_entries", force: :cascade do |t|
    t.string "category", default: "other", null: false
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.text "description", default: ""
    t.decimal "hours", precision: 5, scale: 2, default: "0.0", null: false
    t.bigint "member_id", null: false
    t.string "member_name", default: "", null: false
    t.bigint "nursery_id", null: false
    t.string "nursery_name", default: "", null: false
    t.datetime "updated_at", null: false
    t.index ["member_id"], name: "index_nursery_timesheet_entries_on_member_id"
    t.index ["nursery_id"], name: "index_nursery_timesheet_entries_on_nursery_id"
  end

  create_table "nursery_transfers", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.string "driver_id", default: "", null: false
    t.string "driver_name", default: "", null: false
    t.string "estimated_duration", default: "", null: false
    t.text "notes", default: "", null: false
    t.bigint "order_id", null: false
    t.date "scheduled_date", null: false
    t.string "status", default: "planned", null: false
    t.jsonb "stops", default: [], null: false
    t.decimal "total_distance_km", precision: 8, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.string "vehicle_info", default: "", null: false
    t.index ["order_id"], name: "index_nursery_transfers_on_order_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.text "address"
    t.datetime "archived_at"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "iban"
    t.boolean "is_default", default: false, null: false
    t.string "legal_form"
    t.string "name", null: false
    t.string "phone"
    t.string "registration_number"
    t.datetime "updated_at", null: false
    t.index ["is_default"], name: "index_organizations_on_is_default"
  end

  create_table "pitches", force: :cascade do |t|
    t.string "appetite", null: false
    t.bigint "author_id"
    t.jsonb "breadboard"
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "fat_marker_sketch"
    t.jsonb "no_gos", default: [], null: false
    t.text "problem", null: false
    t.jsonb "rabbit_holes", default: [], null: false
    t.text "solution", null: false
    t.string "status", default: "raw", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_pitches_on_author_id"
    t.index ["deleted_at"], name: "index_pitches_on_deleted_at"
  end

  create_table "plant_activity_items", force: :cascade do |t|
    t.string "activity_type", null: false
    t.bigint "contributor_id", null: false
    t.datetime "created_at", null: false
    t.bigint "target_id", null: false
    t.string "target_name", null: false
    t.string "target_type", null: false
    t.datetime "timestamp", null: false
    t.datetime "updated_at", null: false
    t.index ["contributor_id"], name: "index_plant_activity_items_on_contributor_id"
  end

  create_table "plant_ai_summaries", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.text "error"
    t.datetime "generated_at"
    t.string "status", default: "idle", null: false
    t.bigint "target_id", null: false
    t.string "target_type", null: false
    t.datetime "updated_at", null: false
    t.index ["target_type", "target_id"], name: "index_plant_ai_summaries_on_target_type_and_target_id", unique: true
  end

  create_table "plant_common_names", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "language", null: false
    t.string "name", null: false
    t.bigint "target_id", null: false
    t.string "target_type", null: false
    t.datetime "updated_at", null: false
    t.index ["target_type", "target_id"], name: "index_plant_common_names_on_target_type_and_target_id"
  end

  create_table "plant_contributors", force: :cascade do |t|
    t.jsonb "activity_by_month", default: [], null: false
    t.string "avatar_url", default: "", null: false
    t.datetime "created_at", null: false
    t.date "joined_at", null: false
    t.string "lab_id"
    t.string "name", null: false
    t.integer "notes_written", default: 0, null: false
    t.integer "photos_added", default: 0, null: false
    t.integer "semos_earned", default: 0, null: false
    t.integer "species_created", default: 0, null: false
    t.datetime "updated_at", null: false
    t.integer "varieties_created", default: 0, null: false
  end

  create_table "plant_genera", force: :cascade do |t|
    t.string "common_name", default: "", null: false
    t.datetime "created_at", null: false
    t.text "description", default: "", null: false
    t.string "latin_name", null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.datetime "updated_at", null: false
    t.string "wikipedia_url", default: "", null: false
    t.index ["latin_name"], name: "index_plant_genera_on_latin_name", unique: true
    t.index ["notion_id"], name: "index_plant_genera_on_notion_id", unique: true
  end

  create_table "plant_locations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "is_mother_plant", default: false, null: false
    t.boolean "is_public", default: true, null: false
    t.string "lab_id"
    t.decimal "latitude", precision: 10, scale: 6, null: false
    t.decimal "longitude", precision: 10, scale: 6, null: false
    t.string "place_name", default: "", null: false
    t.integer "planted_year"
    t.bigint "target_id", null: false
    t.string "target_type", null: false
    t.datetime "updated_at", null: false
    t.index ["target_type", "target_id"], name: "index_plant_locations_on_target_type_and_target_id"
  end

  create_table "plant_notes", force: :cascade do |t|
    t.text "content", null: false
    t.bigint "contributor_id", null: false
    t.datetime "created_at", null: false
    t.string "language", default: "fr", null: false
    t.jsonb "photos", default: [], null: false
    t.bigint "target_id", null: false
    t.string "target_type", null: false
    t.datetime "updated_at", null: false
    t.index ["contributor_id"], name: "index_plant_notes_on_contributor_id"
    t.index ["target_type", "target_id"], name: "index_plant_notes_on_target_type_and_target_id"
  end

  create_table "plant_nursery_stocks", force: :cascade do |t|
    t.string "age", default: "", null: false
    t.datetime "created_at", null: false
    t.string "nursery_id", null: false
    t.string "nursery_name", null: false
    t.decimal "price", precision: 10, scale: 2, default: "0.0", null: false
    t.integer "quantity", default: 0, null: false
    t.string "rootstock"
    t.bigint "target_id", null: false
    t.string "target_type", null: false
    t.datetime "updated_at", null: false
    t.index ["target_type", "target_id"], name: "index_plant_nursery_stocks_on_target_type_and_target_id"
  end

  create_table "plant_palette_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.bigint "item_id", null: false
    t.string "item_type", null: false
    t.bigint "palette_id", null: false
    t.integer "position", default: 0, null: false
    t.string "strate_key", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_plant_palette_items_on_deleted_at"
    t.index ["palette_id", "item_type", "item_id"], name: "index_plant_palette_items_on_palette_item_type_id_unique", unique: true, where: "(deleted_at IS NULL)"
    t.index ["palette_id"], name: "index_plant_palette_items_on_palette_id"
  end

  create_table "plant_palettes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "created_by", null: false
    t.text "description", default: "", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
  end

  create_table "plant_photos", force: :cascade do |t|
    t.string "caption", default: "", null: false
    t.bigint "contributor_id", null: false
    t.datetime "created_at", null: false
    t.bigint "target_id", null: false
    t.string "target_type", null: false
    t.datetime "updated_at", null: false
    t.string "url", null: false
    t.index ["contributor_id"], name: "index_plant_photos_on_contributor_id"
    t.index ["target_type", "target_id"], name: "index_plant_photos_on_target_type_and_target_id"
  end

  create_table "plant_records", force: :cascade do |t|
    t.integer "altitude"
    t.datetime "created_at", null: false
    t.string "health_status"
    t.bigint "location_id"
    t.string "name"
    t.text "notes"
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.string "nursery_source"
    t.string "plant_type_category"
    t.date "planting_date"
    t.string "population"
    t.decimal "purchase_price", precision: 10, scale: 2
    t.integer "quantity"
    t.bigint "species_id"
    t.string "status"
    t.datetime "updated_at", null: false
    t.bigint "variety_id"
    t.bigint "zone_id"
    t.index ["location_id"], name: "index_plant_records_on_location_id"
    t.index ["notion_id"], name: "index_plant_records_on_notion_id", unique: true
    t.index ["species_id"], name: "index_plant_records_on_species_id"
    t.index ["variety_id"], name: "index_plant_records_on_variety_id"
    t.index ["zone_id"], name: "index_plant_records_on_zone_id"
  end

  create_table "plant_references", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "reference_type", null: false
    t.string "source", default: "", null: false
    t.bigint "target_id", null: false
    t.string "target_type", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "url", null: false
    t.index ["target_type", "target_id"], name: "index_plant_references_on_target_type_and_target_id"
  end

  create_table "plant_species", force: :cascade do |t|
    t.text "additional_notes"
    t.string "common_names_fr", default: "", null: false
    t.datetime "created_at", null: false
    t.text "description", default: "", null: false
    t.jsonb "ecosystem_needs", default: [], null: false
    t.jsonb "edible_parts", default: [], null: false
    t.jsonb "exposures", default: [], null: false
    t.string "fertility", default: "self-fertile", null: false
    t.jsonb "flower_colors", default: [], null: false
    t.jsonb "flowering_months", default: [], null: false
    t.jsonb "fodder_qualities", default: [], null: false
    t.string "foliage_color", default: "green", null: false
    t.string "foliage_type", default: "deciduous", null: false
    t.string "forest_garden_zone", default: "edge", null: false
    t.string "fragrance", default: "none", null: false
    t.jsonb "fruiting_months", default: [], null: false
    t.bigint "genus_id"
    t.string "growth_rate", default: "medium", null: false
    t.string "hardiness", default: "", null: false
    t.jsonb "harvest_months", default: [], null: false
    t.string "height_description", default: "", null: false
    t.jsonb "interests", default: [], null: false
    t.boolean "is_invasive", default: false, null: false
    t.boolean "is_native_belgium", default: false, null: false
    t.string "latin_name", null: false
    t.string "life_cycle", default: "perennial", null: false
    t.jsonb "native_countries", default: [], null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.string "origin", default: "", null: false
    t.string "plant_type", null: false
    t.jsonb "planting_seasons", default: [], null: false
    t.string "pollination_type", default: "insect", null: false
    t.jsonb "propagation_methods", default: [], null: false
    t.string "root_system", default: "fibrous", null: false
    t.string "soil_moisture", default: "moist", null: false
    t.string "soil_richness", default: "moderate", null: false
    t.jsonb "soil_types", default: [], null: false
    t.string "spread_description", default: "", null: false
    t.text "therapeutic_properties"
    t.text "toxic_elements"
    t.jsonb "transformations", default: [], null: false
    t.datetime "updated_at", null: false
    t.string "watering_need", default: "3", null: false
    t.index ["genus_id"], name: "index_plant_species_on_genus_id"
    t.index ["latin_name"], name: "idx_plant_species_latin_name_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["latin_name"], name: "index_plant_species_on_latin_name", unique: true
    t.index ["notion_id"], name: "index_plant_species_on_notion_id", unique: true
  end

  create_table "plant_varieties", force: :cascade do |t|
    t.text "additional_notes", default: "", null: false
    t.jsonb "characteristics", default: [], null: false
    t.string "common_names_fr", default: "", null: false
    t.datetime "created_at", null: false
    t.text "description", default: "", null: false
    t.string "disease_resistance", default: "", null: false
    t.string "fertility", default: "", null: false
    t.string "fruit_size", default: "", null: false
    t.string "juice_quality", default: "", null: false
    t.jsonb "labels", default: [], null: false
    t.string "latin_name", null: false
    t.string "maturity", default: "", null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.string "productivity", default: "", null: false
    t.boolean "publish_on_website", default: false, null: false
    t.bigint "species_id"
    t.string "storage_life", default: "", null: false
    t.integer "taste_rating"
    t.datetime "updated_at", null: false
    t.jsonb "usages", default: [], null: false
    t.index ["notion_id"], name: "index_plant_varieties_on_notion_id", unique: true
    t.index ["species_id"], name: "index_plant_varieties_on_species_id"
  end

  create_table "pole_projects", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.boolean "needs_reclassification", default: false
    t.text "notes"
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.string "pole"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["notion_id"], name: "index_pole_projects_on_notion_id", unique: true
  end

  create_table "post_its", force: :cascade do |t|
    t.string "author_name"
    t.text "body"
    t.datetime "created_at", null: false
    t.date "date"
    t.bigint "design_project_id"
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.bigint "pole_project_id"
    t.string "post_type"
    t.string "title"
    t.bigint "training_id"
    t.datetime "updated_at", null: false
    t.index ["design_project_id"], name: "index_post_its_on_design_project_id"
    t.index ["notion_id"], name: "index_post_its_on_notion_id", unique: true
    t.index ["pole_project_id"], name: "index_post_its_on_pole_project_id"
    t.index ["training_id"], name: "index_post_its_on_training_id"
  end

  create_table "project_memberships", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "is_paid", default: false
    t.datetime "joined_at"
    t.bigint "member_id", null: false
    t.bigint "projectable_id", null: false
    t.string "projectable_type", null: false
    t.string "role"
    t.datetime "updated_at", null: false
    t.index ["member_id"], name: "index_project_memberships_on_member_id"
    t.index ["projectable_type", "projectable_id", "member_id", "role"], name: "index_project_memberships_uniqueness", unique: true
    t.index ["projectable_type", "projectable_id"], name: "index_project_memberships_on_projectable"
  end

  create_table "revenues", force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "amount_excl_vat", precision: 12, scale: 2, default: "0.0", null: false
    t.string "category", default: "", null: false
    t.bigint "contact_id"
    t.datetime "created_at", null: false
    t.date "date"
    t.datetime "deleted_at"
    t.text "description", default: "", null: false
    t.string "invoice_url", default: "", null: false
    t.string "label", default: "", null: false
    t.text "notes", default: "", null: false
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.date "paid_at"
    t.string "payment_method", default: "", null: false
    t.string "pole"
    t.bigint "projectable_id"
    t.string "projectable_type"
    t.string "revenue_type", default: "", null: false
    t.string "status", default: "draft", null: false
    t.datetime "updated_at", null: false
    t.decimal "vat_21", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "vat_6", precision: 12, scale: 2, default: "0.0", null: false
    t.boolean "vat_exemption", default: false, null: false
    t.string "vat_rate", default: "", null: false
    t.index ["contact_id"], name: "index_revenues_on_contact_id"
    t.index ["date"], name: "index_revenues_on_date"
    t.index ["deleted_at"], name: "index_revenues_on_deleted_at"
    t.index ["notion_id"], name: "index_revenues_on_notion_id", unique: true
    t.index ["pole"], name: "index_revenues_on_pole"
    t.index ["projectable_type", "projectable_id"], name: "index_revenues_on_projectable"
  end

  create_table "scope_tasks", force: :cascade do |t|
    t.boolean "completed", default: false, null: false
    t.datetime "created_at", null: false
    t.boolean "is_nice_to_have", default: false, null: false
    t.bigint "scope_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["scope_id"], name: "index_scope_tasks_on_scope_id"
  end

  create_table "scopes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description", default: "", null: false
    t.integer "hill_position", default: 0, null: false
    t.string "name", null: false
    t.bigint "pitch_id", null: false
    t.datetime "updated_at", null: false
    t.index ["pitch_id"], name: "index_scopes_on_pitch_id"
  end

  create_table "semos_emissions", force: :cascade do |t|
    t.integer "amount", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.text "description", default: "", null: false
    t.string "reason", null: false
    t.datetime "updated_at", null: false
    t.bigint "wallet_id", null: false
    t.index ["created_by_id"], name: "index_semos_emissions_on_created_by_id"
    t.index ["wallet_id"], name: "index_semos_emissions_on_wallet_id"
  end

  create_table "semos_rates", force: :cascade do |t|
    t.integer "amount", null: false
    t.datetime "created_at", null: false
    t.text "description", default: "", null: false
    t.string "rate_type", null: false
    t.datetime "updated_at", null: false
    t.index ["rate_type"], name: "index_semos_rates_on_rate_type", unique: true
  end

  create_table "semos_transactions", force: :cascade do |t|
    t.integer "amount", null: false
    t.datetime "created_at", null: false
    t.text "description", default: "", null: false
    t.bigint "from_wallet_id", null: false
    t.bigint "to_wallet_id", null: false
    t.string "transaction_type", default: "transfer", null: false
    t.datetime "updated_at", null: false
    t.index ["from_wallet_id"], name: "index_semos_transactions_on_from_wallet_id"
    t.index ["to_wallet_id"], name: "index_semos_transactions_on_to_wallet_id"
  end

  create_table "strategy_axes", force: :cascade do |t|
    t.string "color"
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.text "description"
    t.integer "position", default: 0
    t.integer "progress", default: 0
    t.string "status", default: "active"
    t.integer "target_year"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_strategy_axes_on_created_by_id"
    t.index ["position"], name: "index_strategy_axes_on_position"
    t.index ["status"], name: "index_strategy_axes_on_status"
  end

  create_table "strategy_deliberation_comments", force: :cascade do |t|
    t.bigint "author_id"
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.bigint "deliberation_id", null: false
    t.string "phase_at_creation", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_strategy_deliberation_comments_on_author_id"
    t.index ["deliberation_id"], name: "index_strategy_deliberation_comments_on_deliberation_id"
  end

  create_table "strategy_deliberations", force: :cascade do |t|
    t.text "context"
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.datetime "decided_at"
    t.datetime "opened_at"
    t.text "outcome"
    t.string "status", default: "draft", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.datetime "voting_deadline"
    t.datetime "voting_started_at"
    t.index ["created_by_id"], name: "index_strategy_deliberations_on_created_by_id"
    t.index ["status"], name: "index_strategy_deliberations_on_status"
  end

  create_table "strategy_frameworks", force: :cascade do |t|
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.bigint "deliberation_id"
    t.string "framework_type", default: "charter", null: false
    t.string "status", default: "draft"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "version", default: 1
    t.index ["created_by_id"], name: "index_strategy_frameworks_on_created_by_id"
    t.index ["deliberation_id"], name: "index_strategy_frameworks_on_deliberation_id"
    t.index ["framework_type"], name: "index_strategy_frameworks_on_framework_type"
    t.index ["status"], name: "index_strategy_frameworks_on_status"
  end

  create_table "strategy_key_results", force: :cascade do |t|
    t.bigint "axis_id", null: false
    t.datetime "created_at", null: false
    t.decimal "current_value", default: "0.0"
    t.string "metric_type", default: "percentage"
    t.integer "position", default: 0
    t.string "status", default: "on_track"
    t.decimal "target_value"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["axis_id"], name: "index_strategy_key_results_on_axis_id"
  end

  create_table "strategy_proposal_versions", force: :cascade do |t|
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.bigint "proposal_id", null: false
    t.integer "version", null: false
    t.index ["proposal_id", "version"], name: "index_strategy_proposal_versions_unique", unique: true
    t.index ["proposal_id"], name: "index_strategy_proposal_versions_on_proposal_id"
  end

  create_table "strategy_proposals", force: :cascade do |t|
    t.bigint "author_id"
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.bigint "deliberation_id", null: false
    t.datetime "updated_at", null: false
    t.integer "version", default: 1, null: false
    t.index ["author_id"], name: "index_strategy_proposals_on_author_id"
    t.index ["deliberation_id"], name: "index_strategy_proposals_on_deliberation_id_unique", unique: true
  end

  create_table "strategy_reactions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "member_id"
    t.string "position", null: false
    t.bigint "proposal_id", null: false
    t.text "rationale"
    t.datetime "updated_at", null: false
    t.index ["member_id"], name: "index_strategy_reactions_on_member_id"
    t.index ["proposal_id", "member_id"], name: "index_strategy_reactions_on_proposal_id_and_member_id", unique: true
    t.index ["proposal_id"], name: "index_strategy_reactions_on_proposal_id"
  end

  create_table "strategy_resources", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.boolean "pinned", default: false
    t.string "resource_type", default: "article", null: false
    t.string "source_url"
    t.text "summary"
    t.jsonb "tags", default: []
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_strategy_resources_on_created_by_id"
    t.index ["pinned"], name: "index_strategy_resources_on_pinned"
    t.index ["resource_type"], name: "index_strategy_resources_on_resource_type"
  end

  create_table "task_lists", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.integer "position", default: 0
    t.bigint "taskable_id", null: false
    t.string "taskable_type", null: false
    t.datetime "updated_at", null: false
    t.index ["taskable_type", "taskable_id"], name: "index_task_lists_on_taskable_type_and_taskable_id"
  end

  create_table "tasks", force: :cascade do |t|
    t.bigint "assignee_id"
    t.string "assignee_name"
    t.datetime "created_at", null: false
    t.text "description"
    t.date "due_date"
    t.string "name", null: false
    t.bigint "parent_id"
    t.integer "position", default: 0
    t.string "priority"
    t.string "status", default: "pending", null: false
    t.jsonb "tags", default: []
    t.bigint "task_list_id", null: false
    t.integer "time_minutes"
    t.datetime "updated_at", null: false
    t.index ["assignee_id", "status"], name: "index_tasks_on_assignee_id_and_status"
    t.index ["assignee_id"], name: "index_tasks_on_assignee_id"
    t.index ["parent_id"], name: "index_tasks_on_parent_id"
    t.index ["task_list_id"], name: "index_tasks_on_task_list_id"
  end

  create_table "timesheet_service_types", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "default_phase"
    t.datetime "deleted_at"
    t.string "label", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_timesheet_service_types_on_deleted_at"
    t.index ["label"], name: "index_timesheet_service_types_on_label", unique: true
  end

  create_table "timesheets", force: :cascade do |t|
    t.boolean "billed", default: false
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.text "description"
    t.string "details", default: "", null: false
    t.bigint "event_id"
    t.decimal "hours", precision: 5, scale: 2, default: "0.0"
    t.string "member_id", null: false
    t.string "member_name", null: false
    t.string "mode"
    t.datetime "notion_created_at"
    t.string "notion_id"
    t.datetime "notion_updated_at"
    t.string "phase"
    t.bigint "projectable_id"
    t.string "projectable_type"
    t.bigint "service_type_id"
    t.integer "travel_km", default: 0
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_timesheets_on_date"
    t.index ["event_id"], name: "index_timesheets_on_event_id"
    t.index ["member_id"], name: "index_timesheets_on_member_id"
    t.index ["notion_id"], name: "index_timesheets_on_notion_id", unique: true
    t.index ["projectable_type", "projectable_id"], name: "index_timesheets_on_projectable"
    t.index ["service_type_id"], name: "index_timesheets_on_service_type_id"
  end

  create_table "wallets", force: :cascade do |t|
    t.integer "balance", default: 0, null: false
    t.integer "ceiling", default: 1000, null: false
    t.datetime "created_at", null: false
    t.integer "floor", default: -50, null: false
    t.bigint "member_id", null: false
    t.datetime "updated_at", null: false
    t.index ["member_id"], name: "index_wallets_on_member_id", unique: true
  end

  add_foreign_key "academy_participant_categories", "academy_trainings", column: "training_id"
  add_foreign_key "academy_registration_items", "academy_participant_categories", column: "participant_category_id"
  add_foreign_key "academy_registration_items", "academy_training_registrations", column: "registration_id"
  add_foreign_key "academy_registration_packs", "academy_training_packs", column: "pack_id"
  add_foreign_key "academy_registration_packs", "academy_training_registrations", column: "registration_id"
  add_foreign_key "academy_training_attendances", "academy_training_registrations", column: "registration_id"
  add_foreign_key "academy_training_attendances", "academy_training_sessions", column: "session_id"
  add_foreign_key "academy_training_documents", "academy_training_sessions", column: "session_id"
  add_foreign_key "academy_training_documents", "academy_trainings", column: "training_id"
  add_foreign_key "academy_training_pack_items", "academy_participant_categories", column: "participant_category_id"
  add_foreign_key "academy_training_pack_items", "academy_training_packs", column: "pack_id"
  add_foreign_key "academy_training_packs", "academy_trainings", column: "training_id"
  add_foreign_key "academy_training_registrations", "academy_trainings", column: "training_id"
  add_foreign_key "academy_training_registrations", "contacts"
  add_foreign_key "academy_training_sessions", "academy_trainings", column: "training_id"
  add_foreign_key "academy_trainings", "academy_training_types", column: "training_type_id"
  add_foreign_key "actions", "academy_trainings", column: "training_id"
  add_foreign_key "actions", "actions", column: "parent_id"
  add_foreign_key "actions", "guilds"
  add_foreign_key "actions", "pole_projects"
  add_foreign_key "actions", "task_lists"
  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "album_media_items", "albums"
  add_foreign_key "bank_connections", "members", column: "connected_by_id"
  add_foreign_key "bank_reconciliations", "bank_transactions"
  add_foreign_key "bank_reconciliations", "members", column: "matched_by_id"
  add_foreign_key "bank_transactions", "bank_connections"
  add_foreign_key "bet_team_memberships", "bets"
  add_foreign_key "bet_team_memberships", "members"
  add_foreign_key "bets", "cycles"
  add_foreign_key "bets", "members", column: "placed_by_id"
  add_foreign_key "bets", "pitches"
  add_foreign_key "chowder_items", "members", column: "created_by_id"
  add_foreign_key "chowder_items", "pitches"
  add_foreign_key "contact_tags", "contacts"
  add_foreign_key "contacts", "contacts", column: "organization_id"
  add_foreign_key "credentials", "guilds"
  add_foreign_key "credentials", "members", column: "created_by_id"
  add_foreign_key "design_annotations", "design_projects", column: "project_id"
  add_foreign_key "design_client_contributions", "design_projects", column: "project_id"
  add_foreign_key "design_follow_up_visits", "design_projects", column: "project_id"
  add_foreign_key "design_harvest_calendars", "design_projects", column: "project_id"
  add_foreign_key "design_interventions", "design_plant_records", column: "plant_record_id"
  add_foreign_key "design_interventions", "design_projects", column: "project_id"
  add_foreign_key "design_maintenance_calendars", "design_projects", column: "project_id"
  add_foreign_key "design_media_items", "design_projects", column: "project_id"
  add_foreign_key "design_plant_markers", "design_planting_plans", column: "planting_plan_id"
  add_foreign_key "design_plant_markers", "design_project_palette_items", column: "palette_item_id"
  add_foreign_key "design_plant_records", "design_plant_markers", column: "marker_id"
  add_foreign_key "design_plant_records", "design_project_palette_items", column: "palette_item_id"
  add_foreign_key "design_plant_records", "design_projects", column: "project_id"
  add_foreign_key "design_planting_plans", "design_projects", column: "project_id"
  add_foreign_key "design_project_documents", "design_projects", column: "project_id"
  add_foreign_key "design_project_meetings", "design_projects", column: "project_id"
  add_foreign_key "design_project_palette_items", "design_project_palettes", column: "palette_id"
  add_foreign_key "design_project_palettes", "design_projects", column: "project_id"
  add_foreign_key "design_project_timesheets", "design_projects", column: "project_id"
  add_foreign_key "design_project_timesheets", "timesheet_service_types", column: "service_type_id"
  add_foreign_key "design_projects", "design_project_templates", column: "template_id"
  add_foreign_key "design_quote_lines", "design_quotes", column: "quote_id"
  add_foreign_key "design_quotes", "design_projects", column: "project_id"
  add_foreign_key "design_site_analyses", "design_projects", column: "project_id"
  add_foreign_key "design_team_members", "design_projects", column: "project_id"
  add_foreign_key "economic_inputs", "design_projects"
  add_foreign_key "economic_inputs", "location_zones", column: "zone_id"
  add_foreign_key "economic_inputs", "locations"
  add_foreign_key "economic_outputs", "design_projects"
  add_foreign_key "economic_outputs", "location_zones", column: "zone_id"
  add_foreign_key "economic_outputs", "locations"
  add_foreign_key "economic_outputs", "plant_species", column: "species_id"
  add_foreign_key "event_attendees", "events"
  add_foreign_key "event_attendees", "members"
  add_foreign_key "events", "cycles"
  add_foreign_key "events", "event_types"
  add_foreign_key "expense_note_lines", "expense_notes"
  add_foreign_key "expense_notes", "contacts"
  add_foreign_key "expense_notes", "organizations"
  add_foreign_key "expenses", "contacts", column: "supplier_contact_id"
  add_foreign_key "guild_documents", "guilds"
  add_foreign_key "guild_documents", "members", column: "uploaded_by_id"
  add_foreign_key "guilds", "labs"
  add_foreign_key "guilds", "members", column: "leader_id"
  add_foreign_key "hill_chart_snapshots", "pitches"
  add_foreign_key "idea_items", "idea_lists"
  add_foreign_key "knowledge_bookmarks", "knowledge_topics", column: "topic_id"
  add_foreign_key "knowledge_bookmarks", "members", column: "user_id"
  add_foreign_key "knowledge_comments", "knowledge_topics", column: "topic_id"
  add_foreign_key "knowledge_comments", "members", column: "user_id"
  add_foreign_key "knowledge_sections", "members", column: "created_by_id"
  add_foreign_key "knowledge_topic_editors", "knowledge_topics", column: "topic_id"
  add_foreign_key "knowledge_topic_editors", "members", column: "user_id"
  add_foreign_key "knowledge_topic_revisions", "knowledge_topics", column: "topic_id"
  add_foreign_key "knowledge_topic_revisions", "members", column: "user_id"
  add_foreign_key "knowledge_topics", "knowledge_sections", column: "section_id"
  add_foreign_key "knowledge_topics", "members", column: "created_by_id"
  add_foreign_key "lab_memberships", "labs"
  add_foreign_key "lab_memberships", "members"
  add_foreign_key "location_zones", "locations"
  add_foreign_key "marketplace_listings", "members"
  add_foreign_key "member_roles", "members"
  add_foreign_key "notes", "pole_projects"
  add_foreign_key "notion_assets", "notion_records"
  add_foreign_key "nursery_documentation_entries", "nursery_nurseries", column: "nursery_id"
  add_foreign_key "nursery_order_lines", "nursery_nurseries", column: "nursery_id"
  add_foreign_key "nursery_order_lines", "nursery_orders", column: "order_id"
  add_foreign_key "nursery_order_lines", "nursery_stock_batches", column: "stock_batch_id"
  add_foreign_key "nursery_orders", "nursery_nurseries", column: "pickup_nursery_id"
  add_foreign_key "nursery_schedule_slots", "nursery_nurseries", column: "nursery_id"
  add_foreign_key "nursery_schedule_slots", "nursery_team_members", column: "member_id"
  add_foreign_key "nursery_stock_batches", "nursery_containers", column: "container_id"
  add_foreign_key "nursery_stock_batches", "nursery_nurseries", column: "nursery_id"
  add_foreign_key "nursery_team_members", "nursery_nurseries", column: "nursery_id"
  add_foreign_key "nursery_timesheet_entries", "nursery_nurseries", column: "nursery_id"
  add_foreign_key "nursery_timesheet_entries", "nursery_team_members", column: "member_id"
  add_foreign_key "nursery_transfers", "nursery_orders", column: "order_id"
  add_foreign_key "pitches", "members", column: "author_id"
  add_foreign_key "plant_activity_items", "plant_contributors", column: "contributor_id"
  add_foreign_key "plant_notes", "plant_contributors", column: "contributor_id"
  add_foreign_key "plant_palette_items", "plant_palettes", column: "palette_id"
  add_foreign_key "plant_photos", "plant_contributors", column: "contributor_id"
  add_foreign_key "plant_records", "location_zones", column: "zone_id"
  add_foreign_key "plant_records", "locations"
  add_foreign_key "plant_records", "plant_species", column: "species_id"
  add_foreign_key "plant_records", "plant_varieties", column: "variety_id"
  add_foreign_key "plant_species", "plant_genera", column: "genus_id"
  add_foreign_key "plant_varieties", "plant_species", column: "species_id"
  add_foreign_key "post_its", "academy_trainings", column: "training_id"
  add_foreign_key "post_its", "design_projects"
  add_foreign_key "post_its", "pole_projects"
  add_foreign_key "project_memberships", "members"
  add_foreign_key "revenues", "contacts"
  add_foreign_key "scope_tasks", "scopes"
  add_foreign_key "scopes", "pitches"
  add_foreign_key "semos_emissions", "members", column: "created_by_id"
  add_foreign_key "semos_emissions", "wallets"
  add_foreign_key "semos_transactions", "wallets", column: "from_wallet_id"
  add_foreign_key "semos_transactions", "wallets", column: "to_wallet_id"
  add_foreign_key "strategy_axes", "members", column: "created_by_id"
  add_foreign_key "strategy_deliberation_comments", "members", column: "author_id"
  add_foreign_key "strategy_deliberation_comments", "strategy_deliberations", column: "deliberation_id"
  add_foreign_key "strategy_deliberations", "members", column: "created_by_id"
  add_foreign_key "strategy_frameworks", "members", column: "created_by_id"
  add_foreign_key "strategy_frameworks", "strategy_deliberations", column: "deliberation_id"
  add_foreign_key "strategy_key_results", "strategy_axes", column: "axis_id"
  add_foreign_key "strategy_proposal_versions", "strategy_proposals", column: "proposal_id", on_delete: :cascade
  add_foreign_key "strategy_proposals", "members", column: "author_id"
  add_foreign_key "strategy_proposals", "strategy_deliberations", column: "deliberation_id"
  add_foreign_key "strategy_reactions", "members"
  add_foreign_key "strategy_reactions", "strategy_proposals", column: "proposal_id"
  add_foreign_key "strategy_resources", "members", column: "created_by_id"
  add_foreign_key "tasks", "members", column: "assignee_id"
  add_foreign_key "tasks", "task_lists"
  add_foreign_key "tasks", "tasks", column: "parent_id"
  add_foreign_key "timesheets", "events"
  add_foreign_key "timesheets", "timesheet_service_types", column: "service_type_id"
  add_foreign_key "wallets", "members"
end
