class AddNotionTimestampsToModels < ActiveRecord::Migration[8.0]
  def change
    %i[contacts academy_training_locations academy_trainings academy_training_registrations revenues expenses].each do |table|
      add_column table, :notion_created_at, :datetime, null: true
      add_column table, :notion_updated_at, :datetime, null: true
    end
  end
end
