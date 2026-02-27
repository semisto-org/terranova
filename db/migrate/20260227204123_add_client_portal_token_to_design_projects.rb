class AddClientPortalTokenToDesignProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :design_projects, :client_portal_token, :string, limit: 16
    add_index :design_projects, :client_portal_token, unique: true
  end
end
