# frozen_string_literal: true

# Abonnement polymorphe (#103). Quatre états (cf. migration) :
# auto / explicit / unsubscribed / muted (muted = réservé aux Projectable).
# Un seul enregistrement par (membre, objet) — l'état raconte l'histoire.
class Subscription < ApplicationRecord
  STATES = %w[auto explicit unsubscribed muted].freeze
  ACTIVE_STATES = %w[auto explicit].freeze

  belongs_to :subscribable, polymorphic: true
  belongs_to :member

  validates :state, inclusion: { in: STATES }
  validates :member_id, uniqueness: { scope: [:subscribable_type, :subscribable_id] }

  scope :active, -> { where(state: ACTIVE_STATES) }
  scope :muted, -> { where(state: "muted") }

  def active?
    ACTIVE_STATES.include?(state)
  end
end
