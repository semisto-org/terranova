class Guild < ApplicationRecord
  COLORS = %w[blue purple green orange red].freeze

  belongs_to :leader, class_name: "Member", optional: true
  has_many :guild_memberships, dependent: :destroy
  has_many :members, through: :guild_memberships

  validates :name, :color, presence: true
  validates :color, inclusion: { in: COLORS }
end
