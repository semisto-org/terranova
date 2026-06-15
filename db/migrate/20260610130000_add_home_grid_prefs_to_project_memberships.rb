# frozen_string_literal: true

# Préférences par membre pour la grille « Mon accueil » (home) : épinglage,
# ordre personnalisé et dernière visite du projet. Stockées sur la table de
# jointure (membre, projectable) plutôt que dans une table dédiée — décision
# produit (#108) : ces préférences sont strictement par (membre, projet).
class AddHomeGridPrefsToProjectMemberships < ActiveRecord::Migration[8.1]
  def change
    add_column :project_memberships, :pinned_at, :datetime
    add_column :project_memberships, :position, :integer
    add_column :project_memberships, :last_visited_at, :datetime
  end
end
