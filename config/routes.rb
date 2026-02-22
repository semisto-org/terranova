Rails.application.routes.draw do
  # Authentication
  get "login", to: "sessions#new", as: :login
  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy", as: :logout

  # Password reset
  get "forgot-password", to: "password_resets#new", as: :forgot_password
  post "forgot-password", to: "password_resets#create"
  get "reset-password", to: "password_resets#edit", as: :reset_password
  patch "reset-password", to: "password_resets#update"

  # Inertia-powered application frontend
  root "app#index"
  get "lab", to: "app#lab"
  get "academy", to: "app#academy"
  get "academy/calendar", to: "app#academy"
  get "academy/training-types/new", to: "app#academy_training_type_form"
  get "academy/training-types/:id/edit", to: "app#academy_training_type_form"
  get "academy/locations/new", to: "app#academy_location_form"
  get "academy/locations/:id/edit", to: "app#academy_location_form"
  get "academy/:training_id/register", to: "app#academy_registration"
  get "academy/:training_id", to: "app#academy_training"
  get "nursery", to: "app#nursery"
  get "nursery/orders", to: "app#nursery"
  get "nursery/catalog", to: "app#nursery"
  get "design", to: "app#design"
  get "design/:project_id", to: "app#design_project"
  get "client/design/:project_id", to: "app#design_client_portal"
  get "plants", to: "app#plants"
  get "plants/*path", to: "app#plants"
  get "profile", to: "app#profile"
  get "knowledge", to: "app#knowledge"

  namespace :api do
    namespace :v1 do
      get "health", to: "health#show"

      post "nova/chat", to: "nova#chat"

      get "foundation/routes", to: "foundation#routes"
      get "foundation/shell", to: "foundation#shell"
      get "foundation/milestone", to: "foundation#milestone"

      get "profile", to: "profile#show"
      patch "profile", to: "profile#update"
      delete "profile/avatar", to: "profile#remove_avatar"

      get "lab", to: "lab_management#overview"
      get "lab/overview", to: "lab_management#overview"
      get "lab/cycles", to: "lab_management#list_cycles"

      get "lab/members", to: "lab_management#list_members"
      get "lab/members/:id", to: "lab_management#show_member"
      post "lab/members", to: "lab_management#create_member"
      patch "lab/members/:id", to: "lab_management#update_member"
      delete "lab/members/:id/avatar", to: "lab_management#remove_member_avatar"

      get "lab/pitches", to: "lab_management#list_pitches"
      get "lab/pitches/:id", to: "lab_management#show_pitch"
      post "lab/pitches", to: "lab_management#create_pitch"
      patch "lab/pitches/:id", to: "lab_management#update_pitch"
      delete "lab/pitches/:id", to: "lab_management#destroy_pitch"

      post "lab/bets", to: "lab_management#place_bet"
      delete "lab/bets/:id", to: "lab_management#remove_bet"

      post "lab/pitches/:id/scopes", to: "lab_management#create_scope"
      patch "lab/scopes/:id/hill-position", to: "lab_management#update_hill_position"
      post "lab/scopes/:id/tasks", to: "lab_management#add_task"
      patch "lab/tasks/:id/toggle", to: "lab_management#toggle_task"
      post "lab/pitches/:id/chowder-items", to: "lab_management#add_chowder_item"
      delete "lab/chowder-items/:id", to: "lab_management#destroy_chowder_item"
      post "lab/chowder-items/move-to-scope", to: "lab_management#move_to_scope"

      post "lab/idea-items", to: "lab_management#add_idea"
      post "lab/idea-items/vote", to: "lab_management#vote_idea"

      get "lab/event-types", to: "lab_management#list_event_types"
      post "lab/event-types", to: "lab_management#create_event_type"
      patch "lab/event-types/:id", to: "lab_management#update_event_type"
      delete "lab/event-types/:id", to: "lab_management#destroy_event_type"

      get "lab/events", to: "lab_management#list_events"
      get "lab/events/:id", to: "lab_management#show_event"
      get "lab/calendar", to: "lab_management#calendar"
      post "lab/events", to: "lab_management#create_event"
      patch "lab/events/:id", to: "lab_management#update_event"
      delete "lab/events/:id", to: "lab_management#destroy_event"

      get "lab/semos", to: "lab_management#semos"
      post "lab/semos/transfer", to: "lab_management#transfer_semos"
      post "lab/semos/emissions", to: "lab_management#emit_semos"
      patch "lab/semos/rates/:id", to: "lab_management#update_rate"

      get "lab/contacts", to: "lab_management#list_contacts"
      get "lab/contacts/:id", to: "lab_management#show_contact"
      post "lab/contacts", to: "lab_management#create_contact"
      patch "lab/contacts/:id", to: "lab_management#update_contact"
      delete "lab/contacts/:id", to: "lab_management#destroy_contact"

      get "lab/timesheets", to: "lab_management#list_timesheets"
      post "lab/timesheets", to: "lab_management#create_timesheet"
      patch "lab/timesheets/:id", to: "lab_management#update_timesheet"
      delete "lab/timesheets/:id", to: "lab_management#destroy_timesheet"
      patch "lab/timesheets/:id/mark-invoiced", to: "lab_management#mark_invoiced"

      get "lab/expenses", to: "lab_management#list_expenses"
      post "lab/expenses", to: "lab_management#create_expense"
      patch "lab/expenses/:id", to: "lab_management#update_expense"
      delete "lab/expenses/:id", to: "lab_management#destroy_expense"

      get "lab/revenues", to: "lab_management#list_revenues"
      post "lab/revenues", to: "lab_management#create_revenue"
      patch "lab/revenues/:id", to: "lab_management#update_revenue"
      delete "lab/revenues/:id", to: "lab_management#destroy_revenue"

      get "lab/albums", to: "lab_management#list_albums"
      post "lab/albums", to: "lab_management#create_album"
      patch "lab/albums/:id", to: "lab_management#update_album"
      delete "lab/albums/:id", to: "lab_management#destroy_album"
      get "lab/albums/:id/media", to: "lab_management#album_media"
      post "lab/albums/:id/media", to: "lab_management#upload_album_media"
      delete "lab/albums/:id/media/:media_id", to: "lab_management#delete_album_media"

      get "plants/filter-options", to: "plants#filter_options"
      get "plants/search", to: "plants#search"
      get "plants/genera/:id", to: "plants#genus"
      get "plants/species/:id", to: "plants#species"
      get "plants/varieties/:id", to: "plants#variety"
      post "plants/ai-summary", to: "plants#generate_ai_summary"
      get "plants/activity", to: "plants#activity_feed"
      get "plants/contributors/:id", to: "plants#contributor"
      post "plants/palettes", to: "plants#create_palette"
      get "plants/palettes/:id", to: "plants#show_palette"
      patch "plants/palettes/:id", to: "plants#update_palette"
      get "plants/palettes/:id/export", to: "plants#export_palette_pdf"
      post "plants/palettes/:id/send-to-design-studio", to: "plants#send_to_design_studio"
      post "plants/palettes/:palette_id/items", to: "plants#add_palette_item"
      patch "plants/palette-items/:id", to: "plants#move_palette_item"
      delete "plants/palette-items/:id", to: "plants#remove_palette_item"
      post "plants/genera", to: "plants#create_genus"
      patch "plants/genera/:id", to: "plants#update_genus"
      post "plants/species", to: "plants#create_species"
      patch "plants/species/:id", to: "plants#update_species"
      post "plants/varieties", to: "plants#create_variety"
      patch "plants/varieties/:id", to: "plants#update_variety"
      post "plants/notes", to: "plants#create_note"
      post "plants/photos", to: "plants#create_photo"
      post "plants/references", to: "plants#create_reference"

      get "design", to: "design_studio#index"
      get "design/:project_id", to: "design_studio#show"
      post "design", to: "design_studio#create"
      patch "design/:project_id", to: "design_studio#update"
      delete "design/:project_id", to: "design_studio#destroy"
      post "design/:project_id/duplicate", to: "design_studio#duplicate"
      post "design/:project_id/team-members", to: "design_studio#create_team_member"
      delete "design/:project_id/team-members/:member_id", to: "design_studio#destroy_team_member"
      post "design/:project_id/timesheets", to: "design_studio#create_timesheet"
      patch "design/timesheets/:timesheet_id", to: "design_studio#update_timesheet"
      delete "design/timesheets/:timesheet_id", to: "design_studio#destroy_timesheet"
      post "design/:project_id/expenses", to: "design_studio#create_expense"
      patch "design/expenses/:expense_id", to: "design_studio#update_expense"
      delete "design/expenses/:expense_id", to: "design_studio#destroy_expense"
      patch "design/expenses/:expense_id/approve", to: "design_studio#approve_expense"
      patch "design/:project_id/site-analysis", to: "design_studio#upsert_site_analysis"
      post "design/:project_id/palette-items", to: "design_studio#create_palette_item"
      patch "design/palette-items/:item_id", to: "design_studio#update_palette_item"
      delete "design/palette-items/:item_id", to: "design_studio#destroy_palette_item"
      post "design/:project_id/palette/import/:plant_palette_id", to: "design_studio#import_palette_from_plants"
      patch "design/:project_id/planting-plan", to: "design_studio#upsert_planting_plan"
      post "design/:project_id/planting-plan/export", to: "design_studio#export_planting_plan"
      post "design/:project_id/planting-plan/markers", to: "design_studio#create_plant_marker"
      patch "design/planting-plan/markers/:marker_id", to: "design_studio#update_plant_marker"
      delete "design/planting-plan/markers/:marker_id", to: "design_studio#destroy_plant_marker"
      post "design/:project_id/plant-records", to: "design_studio#create_plant_record"
      patch "design/plant-records/:record_id", to: "design_studio#update_plant_record"
      post "design/:project_id/follow-up-visits", to: "design_studio#create_follow_up_visit"
      post "design/:project_id/interventions", to: "design_studio#create_intervention"
      patch "design/:project_id/harvest-calendar", to: "design_studio#update_harvest_calendar"
      patch "design/:project_id/maintenance-calendar", to: "design_studio#update_maintenance_calendar"
      get "design/:project_id/search", to: "design_studio#search"
      post "design/:project_id/quotes", to: "design_studio#create_quote"
      patch "design/quotes/:quote_id", to: "design_studio#update_quote"
      delete "design/quotes/:quote_id", to: "design_studio#destroy_quote"
      patch "design/quotes/:quote_id/send", to: "design_studio#send_quote"
      post "design/quotes/:quote_id/lines", to: "design_studio#create_quote_line"
      patch "design/quote-lines/:line_id", to: "design_studio#update_quote_line"
      delete "design/quote-lines/:line_id", to: "design_studio#destroy_quote_line"
      post "design/:project_id/documents", to: "design_studio#create_document"
      delete "design/documents/:document_id", to: "design_studio#destroy_document"
      post "design/:project_id/media", to: "design_studio#create_media"
      delete "design/media/:media_id", to: "design_studio#destroy_media"
      post "design/:project_id/meetings", to: "design_studio#create_meeting"
      patch "design/meetings/:meeting_id", to: "design_studio#update_meeting"
      delete "design/meetings/:meeting_id", to: "design_studio#destroy_meeting"
      post "design/:project_id/annotations", to: "design_studio#create_annotation"
      patch "design/annotations/:annotation_id/resolve", to: "design_studio#resolve_annotation"
      delete "design/annotations/:annotation_id", to: "design_studio#destroy_annotation"
      get "design/:project_id/client-portal", to: "design_studio#client_portal"
      patch "design/client/quotes/:quote_id/approve", to: "design_studio#client_approve_quote"
      patch "design/client/quotes/:quote_id/reject", to: "design_studio#client_reject_quote"
      patch "design/:project_id/client/questionnaire", to: "design_studio#client_submit_questionnaire"
      post "design/:project_id/client/wishlist", to: "design_studio#client_add_wishlist_item"
      post "design/:project_id/client/journal", to: "design_studio#client_add_journal_entry"
      post "design/:project_id/client-portal-link", to: "design_studio#generate_client_portal_link"

      # Public academy registration (no auth required)
      get "public/academy/trainings/:training_id", to: "public/academy_registrations#training_info"
      post "public/academy/trainings/:training_id/payment-intent", to: "public/academy_registrations#create_payment_intent"
      post "public/stripe-webhooks", to: "public/stripe_webhooks#create"

      get "academy", to: "academy#index"
      get "academy/calendar", to: "academy#calendar"
      get "academy/reporting", to: "academy#reporting"
      post "academy/training-types", to: "academy#create_training_type"
      patch "academy/training-types/:training_type_id", to: "academy#update_training_type"
      delete "academy/training-types/:training_type_id", to: "academy#destroy_training_type"
      post "academy/locations", to: "academy#create_location"
      patch "academy/locations/:location_id", to: "academy#update_location"
      delete "academy/locations/:location_id", to: "academy#destroy_location"
      post "academy/trainings", to: "academy#create_training"
      patch "academy/trainings/:training_id", to: "academy#update_training"
      delete "academy/trainings/:training_id", to: "academy#destroy_training"
      patch "academy/trainings/:training_id/status", to: "academy#update_training_status"
      post "academy/trainings/:training_id/sessions", to: "academy#create_session"
      patch "academy/sessions/:session_id", to: "academy#update_session"
      delete "academy/sessions/:session_id", to: "academy#destroy_session"
      post "academy/trainings/:training_id/registrations", to: "academy#create_registration"
      patch "academy/registrations/:registration_id", to: "academy#update_registration"
      delete "academy/registrations/:registration_id", to: "academy#destroy_registration"
      patch "academy/registrations/:registration_id/payment-status", to: "academy#update_payment_status"
      post "academy/attendance", to: "academy#mark_attendance"
      post "academy/trainings/:training_id/documents", to: "academy#create_document"
      delete "academy/documents/:document_id", to: "academy#destroy_document"
      patch "academy/trainings/:training_id/checklist/toggle/:item_index", to: "academy#toggle_checklist_item"
      post "academy/trainings/:training_id/checklist", to: "academy#add_checklist_item"
      delete "academy/trainings/:training_id/checklist/:item_index", to: "academy#remove_checklist_item"
      post "academy/trainings/:training_id/expenses", to: "academy#create_expense"
      patch "academy/expenses/:expense_id", to: "academy#update_expense"
      delete "academy/expenses/:expense_id", to: "academy#destroy_expense"
      post "academy/idea-notes", to: "academy#create_idea_note"
      patch "academy/idea-notes/:note_id", to: "academy#update_idea_note"
      delete "academy/idea-notes/:note_id", to: "academy#destroy_idea_note"

      get "nursery", to: "nursery#index"
      get "nursery/dashboard", to: "nursery#dashboard"
      get "nursery/catalog", to: "nursery#catalog"

      # Nurseries CRUD
      post "nursery/nurseries", to: "nursery#create_nursery"
      patch "nursery/nurseries/:nursery_id", to: "nursery#update_nursery"
      delete "nursery/nurseries/:nursery_id", to: "nursery#destroy_nursery"

      # Containers CRUD
      post "nursery/containers", to: "nursery#create_container"
      patch "nursery/containers/:container_id", to: "nursery#update_container"
      delete "nursery/containers/:container_id", to: "nursery#destroy_container"

      # Stock batches
      post "nursery/stock-batches", to: "nursery#create_stock_batch"
      patch "nursery/stock-batches/:batch_id", to: "nursery#update_stock_batch"
      delete "nursery/stock-batches/:batch_id", to: "nursery#destroy_stock_batch"

      # Orders
      post "nursery/orders", to: "nursery#create_order"
      get "nursery/orders/:order_id", to: "nursery#show_order"
      patch "nursery/orders/:order_id/process", to: "nursery#process_order"
      patch "nursery/orders/:order_id/ready", to: "nursery#mark_order_ready"
      patch "nursery/orders/:order_id/picked-up", to: "nursery#mark_order_picked_up"
      patch "nursery/orders/:order_id/cancel", to: "nursery#cancel_order"

      # Mother plants
      patch "nursery/mother-plants/:mother_plant_id/validate", to: "nursery#validate_mother_plant"
      patch "nursery/mother-plants/:mother_plant_id/reject", to: "nursery#reject_mother_plant"
      post "nursery/nurseries", to: "nursery#create_nursery"
      patch "nursery/nurseries/:nursery_id", to: "nursery#update_nursery"
      delete "nursery/nurseries/:nursery_id", to: "nursery#destroy_nursery"

      # Knowledge Base
      get "knowledge/sections", to: "knowledge/sections#index"
      get "knowledge/sections/:id", to: "knowledge/sections#show"
      post "knowledge/sections", to: "knowledge/sections#create"
      patch "knowledge/sections/:id", to: "knowledge/sections#update"
      delete "knowledge/sections/:id", to: "knowledge/sections#destroy"

      get "knowledge/topics", to: "knowledge/topics#index"
      get "knowledge/topics/:id", to: "knowledge/topics#show"
      post "knowledge/topics", to: "knowledge/topics#create"
      patch "knowledge/topics/:id", to: "knowledge/topics#update"
      delete "knowledge/topics/:id", to: "knowledge/topics#destroy"
      patch "knowledge/topics/:id/pin", to: "knowledge/topics#pin"
      patch "knowledge/topics/:id/unpin", to: "knowledge/topics#unpin"
      get "knowledge/topics/:id/related", to: "knowledge/topics#related"
      post "knowledge/topics/:id/attachments", to: "knowledge/topics#add_attachment"
      delete "knowledge/topics/:id/attachments/:attachment_id", to: "knowledge/topics#remove_attachment"
      post "knowledge/topics/:id/bookmark", to: "knowledge/topics#bookmark"
      delete "knowledge/topics/:id/bookmark", to: "knowledge/topics#unbookmark"
      get "knowledge/topics/:id/revisions", to: "knowledge/topics#revisions"
      get "knowledge/topics/:id/comments", to: "knowledge/topics#comments"
      post "knowledge/topics/:id/comments", to: "knowledge/topics#create_comment"
      patch "knowledge/topics/:topic_id/comments/:id", to: "knowledge/topics#update_comment"
      delete "knowledge/topics/:topic_id/comments/:id", to: "knowledge/topics#destroy_comment"

      get "knowledge/bookmarks", to: "knowledge/bookmarks#index"
      get "knowledge/search", to: "knowledge/search#index"

      # Notion Records
      get "notion_records/search", to: "notion_records#search"
      post "notion_records/upsert", to: "notion_records#upsert"

      # Transfers
      post "nursery/transfers", to: "nursery#create_transfer"
      patch "nursery/transfers/:transfer_id/start", to: "nursery#start_transfer"
      patch "nursery/transfers/:transfer_id/complete", to: "nursery#complete_transfer"
      patch "nursery/transfers/:transfer_id/cancel", to: "nursery#cancel_transfer"

      # Team members
      get "nursery/team", to: "nursery#list_team_members"
      post "nursery/team", to: "nursery#create_team_member"
      patch "nursery/team/:member_id", to: "nursery#update_team_member"
      delete "nursery/team/:member_id", to: "nursery#destroy_team_member"

      # Schedule
      get "nursery/schedule", to: "nursery#list_schedule"
      post "nursery/schedule", to: "nursery#create_schedule_slot"
      patch "nursery/schedule/:slot_id", to: "nursery#update_schedule_slot"
      delete "nursery/schedule/:slot_id", to: "nursery#destroy_schedule_slot"

      # Documentation
      get "nursery/documentation", to: "nursery#list_documentation"
      post "nursery/documentation", to: "nursery#create_documentation"
      patch "nursery/documentation/:doc_id", to: "nursery#update_documentation"
      delete "nursery/documentation/:doc_id", to: "nursery#destroy_documentation"

      # Timesheets
      get "nursery/timesheets", to: "nursery#list_timesheets"
      post "nursery/timesheets", to: "nursery#create_timesheet"
      patch "nursery/timesheets/:entry_id", to: "nursery#update_timesheet"
      delete "nursery/timesheets/:entry_id", to: "nursery#destroy_timesheet"

      get "website/home", to: "website#home"
      get "website/articles", to: "website#articles"
      get "website/events", to: "website#events"
      get "website/courses", to: "website#courses"
      get "website/lab/:lab_slug", to: "placeholders#show", defaults: { section: "website", route: "/:labSlug" }

      get "engagement", to: "placeholders#show", defaults: { section: "citizen_engagement", route: "/engagement" }
      get "engagement/map", to: "placeholders#show", defaults: { section: "citizen_engagement", route: "/engagement/map" }

      get "partner", to: "placeholders#show", defaults: { section: "partner_portal", route: "/partner" }
    end
  end

  # Catch-all route for client-side routing (must be last)
  get "*path", to: "app#fallback", constraints: ->(req) { !req.path.start_with?("/api/", "/rails/") }
end
