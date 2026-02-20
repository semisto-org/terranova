class AddDeletedAtForSoftDelete < ActiveRecord::Migration[8.0]
  def change
    tables = %i[
      academy_trainings
      academy_training_types
      academy_training_sessions
      academy_training_registrations
      academy_training_documents
      academy_training_locations
      academy_idea_notes
      expenses
      contacts
      pitches
      bets
      chowder_items
      events
      event_types
      timesheets
      design_projects
      design_team_members
      design_project_timesheets
      design_project_palette_items
      design_plant_markers
      design_quotes
      design_quote_lines
      design_project_documents
      design_media_items
      design_project_meetings
      design_annotations
      nursery_stock_batches
      plant_palette_items
    ]

    tables.each do |table|
      add_column table, :deleted_at, :datetime, null: true
      add_index  table, :deleted_at
    end
  end
end
