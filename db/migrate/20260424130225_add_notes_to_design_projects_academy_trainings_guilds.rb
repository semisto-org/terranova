class AddNotesToDesignProjectsAcademyTrainingsGuilds < ActiveRecord::Migration[8.1]
  def change
    add_column :design_projects, :notes, :text
    add_column :academy_trainings, :notes, :text
    add_column :guilds, :notes, :text
  end
end
