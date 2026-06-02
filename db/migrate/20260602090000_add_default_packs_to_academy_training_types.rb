# frozen_string_literal: true

# #36 : pré-remplir les packs/prix depuis le type d'activité. On suit le pattern
# jsonb existant (default_categories). Chaque pack par défaut référence les
# catégories par LIBELLÉ (les catégories par défaut n'ont pas d'id sur le type) :
#   { "name": "...", "price": 0, "deposit_amount": 0,
#     "items": [{ "category_label": "Standard", "quantity": 1 }] }
class AddDefaultPacksToAcademyTrainingTypes < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_training_types, :default_packs, :jsonb, default: [], null: false
  end
end
