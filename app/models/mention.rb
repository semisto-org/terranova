# frozen_string_literal: true

# @mention structurée d'un membre dans un commentaire (#102).
# Alimentée exclusivement par Comment#sync_mentions! (extraction serveur) —
# c'est la donnée que le service de notifications (#104) consommera.
class Mention < ApplicationRecord
  belongs_to :comment
  belongs_to :member

  validates :member_id, uniqueness: { scope: :comment_id }
end
