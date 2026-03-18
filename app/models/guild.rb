class Guild < ApplicationRecord
  COLORS = %w[blue purple green orange red].freeze
  GUILD_TYPES = %w[lab network].freeze

  belongs_to :leader, class_name: "Member", optional: true
  belongs_to :lab, optional: true

  has_many :guild_memberships, dependent: :destroy
  has_many :members, through: :guild_memberships

  validates :name, :color, presence: true
  validates :color, inclusion: { in: COLORS }
  validates :guild_type, inclusion: { in: GUILD_TYPES }
  validates :lab_id, presence: true, if: -> { guild_type == "lab" }

  scope :lab_guilds, -> { where(guild_type: "lab") }
  scope :network_guilds, -> { where(guild_type: "network") }
end
