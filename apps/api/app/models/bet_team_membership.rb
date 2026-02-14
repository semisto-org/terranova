class BetTeamMembership < ApplicationRecord
  belongs_to :bet
  belongs_to :member

  validates :member_id, uniqueness: { scope: :bet_id }
end
