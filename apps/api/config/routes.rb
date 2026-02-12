Rails.application.routes.draw do
  # Inertia-powered application frontend
  get "app", to: "app#index"
  get "app/lab", to: "app#lab"
  get "app/*path", to: "app#index"
  get "plants", to: "app#plants"
  get "plants/*path", to: "app#plants"

  namespace :api do
    namespace :v1 do
      get "health", to: "health#show"

      get "foundation/routes", to: "foundation#routes"
      get "foundation/shell", to: "foundation#shell"
      get "foundation/milestone", to: "foundation#milestone"

      get "lab", to: "lab_management#overview"
      get "lab/overview", to: "lab_management#overview"
      get "lab/cycles", to: "lab_management#list_cycles"

      get "lab/members", to: "lab_management#list_members"
      get "lab/members/:id", to: "lab_management#show_member"
      post "lab/members", to: "lab_management#create_member"
      patch "lab/members/:id", to: "lab_management#update_member"

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

      get "lab/timesheets", to: "lab_management#list_timesheets"
      post "lab/timesheets", to: "lab_management#create_timesheet"
      patch "lab/timesheets/:id", to: "lab_management#update_timesheet"
      delete "lab/timesheets/:id", to: "lab_management#destroy_timesheet"
      patch "lab/timesheets/:id/mark-invoiced", to: "lab_management#mark_invoiced"

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
      post "plants/notes", to: "plants#create_note"
      post "plants/photos", to: "plants#create_photo"
      post "plants/references", to: "plants#create_reference"

      get "design", to: "placeholders#show", defaults: { section: "design_studio", route: "/design" }
      get "design/:project_id", to: "placeholders#show", defaults: { section: "design_studio", route: "/design/:projectId" }

      get "academy", to: "placeholders#show", defaults: { section: "academy", route: "/academy" }
      get "academy/:training_id", to: "placeholders#show", defaults: { section: "academy", route: "/academy/:trainingId" }
      get "academy/calendar", to: "placeholders#show", defaults: { section: "academy", route: "/academy/calendar" }

      get "nursery", to: "placeholders#show", defaults: { section: "nursery", route: "/nursery" }
      get "nursery/orders", to: "placeholders#show", defaults: { section: "nursery", route: "/nursery/orders" }
      get "nursery/catalog", to: "placeholders#show", defaults: { section: "nursery", route: "/nursery/catalog" }

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
end
