Rails.application.routes.draw do
  # My Semisto — Custom domain (my.semisto.org)
  if ENV["MY_SEMISTO_HOST"].present?
    constraints(host: ENV["MY_SEMISTO_HOST"]) do
      get "/", to: "my_semisto#dashboard", as: false
      get "/login", to: "my_semisto#login", as: false
      post "/login", to: "my_semisto#request_magic_link", as: false
      get "/auth/verify", to: "my_semisto#verify_magic_link", as: false
      delete "/logout", to: "my_semisto#logout", as: false
      get "/academy", to: "my_semisto#academy", as: false
      get "/academy/:training_id", to: "my_semisto#training_detail", as: false
      get "/directory", to: "my_semisto#directory", as: false
      get "/directory/:id", to: "my_semisto#directory_contact", as: false
      get "/profile", to: "my_semisto#profile", as: false

      scope :api, as: false do
        scope :v1, as: false do
          post "auth/request-link", to: "api/v1/my_semisto#request_magic_link", as: false
          get "auth/verify", to: "api/v1/my_semisto#verify", as: false
          get "academy", to: "api/v1/my_semisto#academy_trainings", as: false
          get "academy/:training_id", to: "api/v1/my_semisto#academy_training_detail", as: false
          get "directory", to: "api/v1/my_semisto#directory", as: false
          get "directory/:id", to: "api/v1/my_semisto#directory_contact", as: false
          get "profile", to: "api/v1/my_semisto#profile", as: false
          patch "profile", to: "api/v1/my_semisto#update_profile", as: false
          delete "profile/avatar", to: "api/v1/my_semisto#remove_avatar", as: false
          get "academy/:training_id/carpooling", to: "api/v1/my_semisto#carpooling", as: false
          patch "academy/:training_id/carpooling", to: "api/v1/my_semisto#update_carpooling", as: false
        end
      end

      # Catch-all for my.semisto.org — redirect unknown paths to root
      get "*path", to: redirect("/"), as: false, constraints: ->(req) { !req.path.start_with?("/api/", "/rails/") }
    end
  end

  # My Semisto — Contact Portal (path-based, always available)

  scope "/my", as: :my_semisto do
    get "/", to: "my_semisto#dashboard", as: :dashboard
    get "/login", to: "my_semisto#login", as: :login
    post "/login", to: "my_semisto#request_magic_link", as: :request_link
    get "/auth/verify", to: "my_semisto#verify_magic_link", as: :verify
    delete "/logout", to: "my_semisto#logout", as: :logout
    get "/academy", to: "my_semisto#academy", as: :academy
    get "/academy/:training_id", to: "my_semisto#training_detail", as: :training
    get "/directory", to: "my_semisto#directory", as: :directory
    get "/directory/:id", to: "my_semisto#directory_contact", as: :directory_contact
    get "/profile", to: "my_semisto#profile", as: :profile
  end

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
  get "lab", to: redirect("/")
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
  get "guilds", to: "app#guilds"
  get "guilds/:id", to: "app#guilds"
  get "profile", to: "app#profile"
  get "knowledge", to: "app#knowledge"
  get "strategy", to: "app#strategy"
  get "marketplace", to: "app#marketplace"
  get "admin", to: "app#admin"
  get "admin/settings", to: "app#admin"
  get "parametres", to: "app#parametres"

  get "calendar/semisto.ics", to: "calendar_feeds#semisto"
  get "calendar/trainings.ics", to: "calendar_feeds#trainings"

  mount ActionCable.server => "/cable"

  namespace :api do
    namespace :v1 do
      # My Semisto (contact portal API)
      scope :my do
        post "auth/request-link", to: "my_semisto#request_magic_link"
        get "auth/verify", to: "my_semisto#verify"
        get "academy", to: "my_semisto#academy_trainings"
        get "academy/:training_id", to: "my_semisto#academy_training_detail"
        get "directory", to: "my_semisto#directory"
        get "directory/:id", to: "my_semisto#directory_contact"
        get "profile", to: "my_semisto#profile"
        patch "profile", to: "my_semisto#update_profile"
        delete "profile/avatar", to: "my_semisto#remove_avatar"
        get "academy/:training_id/carpooling", to: "my_semisto#carpooling"
        patch "academy/:training_id/carpooling", to: "my_semisto#update_carpooling"
      end

      get "health", to: "health#show"

      post "nova/chat", to: "nova#chat"

      get "search/global", to: "search#global"

      get "foundation/routes", to: "foundation#routes"
      get "foundation/shell", to: "foundation#shell"
      get "foundation/milestone", to: "foundation#milestone"
      get "foundation/impact", to: "foundation#impact"

      get "geocoding", to: "geocoding#show"

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

      get "lab/timesheet-service-types", to: "lab_management#list_timesheet_service_types"
      post "lab/timesheet-service-types", to: "lab_management#create_timesheet_service_type"
      patch "lab/timesheet-service-types/:id", to: "lab_management#update_timesheet_service_type"
      delete "lab/timesheet-service-types/:id", to: "lab_management#destroy_timesheet_service_type"

      get "settings/cycles", to: "settings/cycles#index"
      post "settings/cycles", to: "settings/cycles#create"
      patch "settings/cycles/:id", to: "settings/cycles#update"
      delete "settings/cycles/:id", to: "settings/cycles#destroy"

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
      post "lab/contacts/:id/impersonate", to: "lab_management#impersonate_contact"

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
      get "lab/reporting", to: "lab_management#reporting"
      post "lab/revenues", to: "lab_management#create_revenue"
      patch "lab/revenues/:id", to: "lab_management#update_revenue"
      delete "lab/revenues/:id", to: "lab_management#destroy_revenue"

      get "lab/projects", to: "lab_management#list_projects"
      get "lab/projects/:id", to: "lab_management#show_project"
      post "lab/projects", to: "lab_management#create_project"
      patch "lab/projects/:id", to: "lab_management#update_project"
      delete "lab/projects/:id", to: "lab_management#destroy_project"
      post "lab/projects/:id/task-lists", to: "lab_management#create_project_task_list"
      patch "lab/projects/:id/task-lists/reorder", to: "lab_management#reorder_project_task_lists"
      patch "lab/task-lists/:id", to: "lab_management#update_project_task_list"
      delete "lab/task-lists/:id", to: "lab_management#destroy_project_task_list"
      post "lab/task-lists/:id/actions", to: "lab_management#create_project_action"
      patch "lab/task-lists/:id/actions/reorder", to: "lab_management#reorder_project_actions"
      patch "lab/actions/:id", to: "lab_management#update_project_action"
      patch "lab/actions/:id/toggle", to: "lab_management#toggle_project_action"
      delete "lab/actions/:id", to: "lab_management#destroy_project_action"
      get "lab/my-tasks", to: "lab_management#my_tasks"
      post "lab/projects/:id/documents", to: "lab_management#upload_project_document"
      delete "lab/documents/:id", to: "lab_management#delete_project_document"

      # Labs
      get "labs", to: "labs#index"
      get "labs/:id", to: "labs#show"
      post "labs", to: "labs#create"
      patch "labs/:id", to: "labs#update"
      delete "labs/:id", to: "labs#destroy"
      post "labs/:lab_id/members", to: "labs#add_member"
      delete "labs/:lab_id/members/:member_id", to: "labs#remove_member"

      # Guilds
      get "guilds", to: "guilds#index"
      get "guilds/:id", to: "guilds#show"
      post "guilds", to: "guilds#create"
      patch "guilds/:id", to: "guilds#update"
      delete "guilds/:id", to: "guilds#destroy"

      # Guild documents
      get "guilds/:guild_id/documents", to: "guilds#list_documents"
      post "guilds/:guild_id/documents", to: "guilds#create_document"
      delete "guilds/:guild_id/documents/:id", to: "guilds#destroy_document"

      # Guild task lists
      get "guilds/:guild_id/task-lists", to: "guilds#list_task_lists"
      post "guilds/:guild_id/task-lists", to: "guilds#create_task_list"
      patch "guilds/:guild_id/task-lists/:id", to: "guilds#update_task_list"
      delete "guilds/:guild_id/task-lists/:id", to: "guilds#destroy_task_list"

      # Guild task list actions
      post "guilds/:guild_id/task-lists/:task_list_id/actions", to: "guilds#create_action"
      patch "guilds/:guild_id/actions/:id", to: "guilds#update_action"
      delete "guilds/:guild_id/actions/:id", to: "guilds#destroy_action"

      # Guild credentials
      get "guilds/:guild_id/credentials", to: "guilds#list_credentials"
      post "guilds/:guild_id/credentials", to: "guilds#create_credential"
      patch "guilds/:guild_id/credentials/:id", to: "guilds#update_credential"
      get "guilds/:guild_id/credentials/:id/reveal", to: "guilds#reveal_credential"
      delete "guilds/:guild_id/credentials/:id", to: "guilds#destroy_credential"

      # Guild memberships
      post "guilds/:guild_id/members", to: "guilds#add_member"
      delete "guilds/:guild_id/members/:member_id", to: "guilds#remove_member"

      get "lab/albums", to: "lab_management#list_albums"
      post "lab/albums", to: "lab_management#create_album"
      patch "lab/albums/:id", to: "lab_management#update_album"
      delete "lab/albums/:id", to: "lab_management#destroy_album"
      get "lab/albums/:id/media", to: "lab_management#album_media"
      post "lab/albums/:id/media", to: "lab_management#upload_album_media"
      delete "lab/albums/:id/media/:media_id", to: "lab_management#delete_album_media"

      get "plants/filter-options", to: "plants#filter_options"
      get "plants/genera", to: "plants#list_genera"
      get "plants/species", to: "plants#list_species"
      get "plants/search", to: "plants#search"
      get "plants/genera/:id", to: "plants#genus"
      get "plants/species/:id", to: "plants#species"
      get "plants/varieties/:id", to: "plants#variety"
      post "plants/ai-summary", to: "plants#generate_ai_summary"
      get "plants/activity", to: "plants#activity_feed"
      get "plants/contributors/:id", to: "plants#contributor"
      get "plants/palettes", to: "plants#list_palettes"
      post "plants/palettes", to: "plants#create_palette"
      get "plants/palettes/:id", to: "plants#show_palette"
      patch "plants/palettes/:id", to: "plants#update_palette"
      delete "plants/palettes/:id", to: "plants#destroy_palette"
      get "plants/palettes/:id/export", to: "plants#export_palette_pdf"
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
      get "design/reporting", to: "design_studio#reporting"
      get "design_studio/reporting", to: "design_studio#reporting"
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
      post "design/:project_id/palette/export-to-plants", to: "design_studio#export_palette_to_plants"
      patch "design/:project_id/planting-plan", to: "design_studio#upsert_planting_plan"
      post "design/:project_id/planting-plan/upload", to: "design_studio#upload_plan_image"
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
      post "design/:project_id/task-lists", to: "design_studio#create_design_task_list"
      patch "design/task-lists/:id", to: "design_studio#update_design_task_list"
      delete "design/task-lists/:id", to: "design_studio#destroy_design_task_list"
      post "design/task-lists/:task_list_id/tasks", to: "design_studio#create_design_task"
      patch "design/tasks/:id", to: "design_studio#update_design_task"
      patch "design/tasks/:id/toggle", to: "design_studio#toggle_design_task"
      delete "design/tasks/:id", to: "design_studio#destroy_design_task"
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
      get "academy/dashboard", to: "academy#dashboard"
      get "academy/calendar", to: "academy#calendar"
      get "academy/reporting", to: "academy#reporting"
      get "academy/calendar-links", to: "academy#calendar_links"
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
      post "academy/holidays/toggle", to: "academy#toggle_holiday"
      get "academy/team", to: "academy#list_team"
      get "academy/team/check-email", to: "academy#check_team_email"
      post "academy/team", to: "academy#create_team_member"
      get "academy/team/:contact_id", to: "academy#show_team_member"
      patch "academy/team/:contact_id", to: "academy#update_team_member"
      delete "academy/team/:contact_id", to: "academy#remove_team_member"
      get "academy/settings", to: "academy#academy_settings"
      patch "academy/settings", to: "academy#update_academy_settings"

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

      # Marketplace Semos
      get "marketplace", to: "marketplace#index"
      get "marketplace/mine", to: "marketplace#mine"
      get "marketplace/:id", to: "marketplace#show"
      post "marketplace", to: "marketplace#create"
      patch "marketplace/:id", to: "marketplace#update"
      delete "marketplace/:id", to: "marketplace#destroy"
      delete "marketplace/:id/images/:image_id", to: "marketplace#destroy_image"

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

      # Strategy — Stratego
      get "strategy/resources", to: "strategy/resources#index"
      get "strategy/resources/:id", to: "strategy/resources#show"
      post "strategy/resources", to: "strategy/resources#create"
      patch "strategy/resources/:id", to: "strategy/resources#update"
      delete "strategy/resources/:id", to: "strategy/resources#destroy"
      patch "strategy/resources/:id/pin", to: "strategy/resources#pin"

      get "strategy/deliberations", to: "strategy/deliberations#index"
      get "strategy/deliberations/:id", to: "strategy/deliberations#show"
      post "strategy/deliberations", to: "strategy/deliberations#create"
      patch "strategy/deliberations/:id", to: "strategy/deliberations#update"
      delete "strategy/deliberations/:id", to: "strategy/deliberations#destroy"
      patch "strategy/deliberations/:id/decide", to: "strategy/deliberations#decide"
      post "strategy/deliberations/:id/proposals", to: "strategy/deliberations#create_proposal"
      patch "strategy/proposals/:id", to: "strategy/deliberations#update_proposal"
      delete "strategy/proposals/:id", to: "strategy/deliberations#destroy_proposal"
      post "strategy/proposals/:id/reactions", to: "strategy/deliberations#create_reaction"
      get "strategy/deliberations/:id/comments", to: "strategy/deliberations#comments"
      post "strategy/deliberations/:id/comments", to: "strategy/deliberations#create_comment"
      delete "strategy/deliberation-comments/:id", to: "strategy/deliberations#destroy_comment"

      get "strategy/frameworks", to: "strategy/frameworks#index"
      get "strategy/frameworks/:id", to: "strategy/frameworks#show"
      post "strategy/frameworks", to: "strategy/frameworks#create"
      patch "strategy/frameworks/:id", to: "strategy/frameworks#update"
      delete "strategy/frameworks/:id", to: "strategy/frameworks#destroy"

      get "strategy/axes", to: "strategy/axes#index"
      get "strategy/axes/:id", to: "strategy/axes#show"
      post "strategy/axes", to: "strategy/axes#create"
      patch "strategy/axes/:id", to: "strategy/axes#update"
      delete "strategy/axes/:id", to: "strategy/axes#destroy"
      post "strategy/axes/:id/key-results", to: "strategy/axes#create_key_result"
      patch "strategy/key-results/:id", to: "strategy/axes#update_key_result"
      delete "strategy/key-results/:id", to: "strategy/axes#destroy_key_result"

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

      get "economics/inputs", to: "economics#inputs"
      post "economics/inputs", to: "economics#create_input"
      patch "economics/inputs/:id", to: "economics#update_input"
      delete "economics/inputs/:id", to: "economics#destroy_input"

      get "economics/outputs", to: "economics#outputs"
      post "economics/outputs", to: "economics#create_output"
      patch "economics/outputs/:id", to: "economics#update_output"
      delete "economics/outputs/:id", to: "economics#destroy_output"

      get "economics/dashboard", to: "economics#dashboard"

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
  get "*path", to: "app#fallback", constraints: ->(req) {
    !req.path.start_with?("/api/", "/rails/") &&
    req.host != ENV["MY_SEMISTO_HOST"]
  }
end
