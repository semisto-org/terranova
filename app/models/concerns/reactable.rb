# frozen_string_literal: true

# Rend un modèle « réactionnable » (#111) : il porte des Reaction polymorphes et
# expose le comptage groupé + la liste des auteurs, dans la forme unifiée
# consommée par l'API des réactions. Aucune notification n'est émise par une
# réaction (le Reaction model n'a aucun hook de notification).
module Reactable
  extend ActiveSupport::Concern

  included do
    # class_name pinné en absolu : sans ça, un modèle namespacé (Strategy::…)
    # ferait inférer Strategy::Reaction / table strategy_reactions.
    has_many :reactions, as: :reactable, class_name: "::Reaction", dependent: :destroy
  end

  # { "thumbs_up" => 2, "heart" => 1 }
  def reaction_counts
    reactions.group(:content).count
  end

  # { "thumbs_up" => [{ id:, firstName:, lastName:, avatar: }], ... }
  def reaction_authors
    reactions.includes(:member).group_by(&:content).transform_values do |list|
      list.map { |reaction| Reactable.author_payload(reaction.member) }
    end
  end

  def self.author_payload(member)
    return { id: nil } unless member

    { id: member.id, firstName: member.first_name, lastName: member.last_name, avatar: member.avatar_url }
  end
end
