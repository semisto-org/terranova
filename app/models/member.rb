class Member < ApplicationRecord
  has_secure_password validations: false

  validates :password, length: { minimum: 8 }, if: -> { password.present? }

  has_many :member_roles, dependent: :destroy

  has_many :guild_memberships, dependent: :destroy
  has_many :guilds, through: :guild_memberships

  has_one :wallet, dependent: :destroy

  has_many :timesheets, dependent: :destroy
  has_many :authored_pitches, class_name: "Pitch", foreign_key: :author_id, dependent: :nullify

  has_many :placed_bets, class_name: "Bet", foreign_key: :placed_by_id, dependent: :nullify

  validates :first_name, :last_name, :email, :status, :joined_at, presence: true

  enum :status, { active: "active", inactive: "inactive" }, validate: true

  def role_names
    member_roles.pluck(:role)
  end

  def guild_ids_list
    guild_memberships.pluck(:guild_id)
  end
end
