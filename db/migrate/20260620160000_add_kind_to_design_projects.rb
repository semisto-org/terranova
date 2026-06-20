class AddKindToDesignProjects < ActiveRecord::Migration[8.1]
  # Projets internes Design Studio (#159) : 3e axe orthogonal à phase (pipeline
  # commercial) et status (cycle de vie). Tous les projets existants restent
  # `client` (default). `internal` = coquille purement design, zéro finance.
  def change
    add_column :design_projects, :kind, :string, null: false, default: "client"
    add_index :design_projects, :kind
  end
end
