# frozen_string_literal: true

module Reactions
  # Pont LECTURE (#111) : expose les réactions héritées de
  # strategy_comment_reactions (colonne `emoji`) dans la forme unifiée
  # counts/authors du nouveau substrat, SANS aucune migration destructive.
  # Les valeurs d'emoji legacy appartiennent à la même liste fermée que
  # Reaction::CONTENTS, donc `emoji` se lit directement comme `content`.
  class LegacyReader
    def initialize(comment_id)
      @scope = Strategy::CommentReaction.where(comment_id: comment_id)
    end

    # { "thumbs_up" => 1 }
    def counts
      @scope.group(:emoji).count
    end

    # { "thumbs_up" => [{ id:, firstName:, lastName:, avatar: }], ... }
    def authors
      @scope.includes(:member).group_by(&:emoji).transform_values do |list|
        list.map { |reaction| Reactable.author_payload(reaction.member) }
      end
    end
  end
end
