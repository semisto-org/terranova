class EnrichPoleProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :pole_projects, :description, :text
    add_column :pole_projects, :notes, :text
    add_column :pole_projects, :pole, :string
  end
end
