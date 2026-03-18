class Lab < ApplicationRecord
  has_many :lab_memberships, dependent: :destroy
  has_many :members, through: :lab_memberships
  has_many :guilds, -> { where(guild_type: "lab") }

  validates :name, :slug, presence: true
  validates :slug, uniqueness: true
end
