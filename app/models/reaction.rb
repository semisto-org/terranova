# frozen_string_literal: true

# Réaction polymorphe (#111) — « Boost » Basecamp : acquittement calme sur
# n'importe quel objet, SANS notification (doctrine du social calme). Généralise
# le précédent non polymorphe strategy_comment_reactions (réactions emoji sur
# les commentaires de délibération). La liste de contenus est FERMÉE — pas de
# texte libre, pas d'emoji personnalisé.
#
# Câbler un nouveau parent = `include Reactable` dans son modèle + l'ajouter à
# l'allowlist du contrôleur. Substrat seul : aucun branchement UI ici (→ #111b).
class Reaction < ApplicationRecord
  CONTENTS = %w[thumbs_up bulb question heart].freeze

  belongs_to :reactable, polymorphic: true
  belongs_to :member

  validates :content, presence: true, inclusion: { in: CONTENTS }
  validates :member_id, uniqueness: { scope: %i[reactable_type reactable_id content] }
end
