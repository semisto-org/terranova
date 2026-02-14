class GuildMembership < ApplicationRecord
  belongs_to :guild
  belongs_to :member

  validates :member_id, uniqueness: { scope: :guild_id }
end
