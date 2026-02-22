class Member < ApplicationRecord
  has_secure_password validations: false

  validates :password, length: { minimum: 8 }, if: -> { password.present? }

  has_one_attached :avatar_image

  has_many :member_roles, dependent: :destroy

  has_many :guild_memberships, dependent: :destroy
  has_many :guilds, through: :guild_memberships

  has_one :wallet, dependent: :destroy

  has_many :timesheets, dependent: :destroy
  has_many :authored_pitches, class_name: "Pitch", foreign_key: :author_id, dependent: :nullify

  has_many :placed_bets, class_name: "Bet", foreign_key: :placed_by_id, dependent: :nullify

  MEMBER_KINDS = %w[human ai].freeze
  MEMBERSHIP_TYPES = %w[effective adherent].freeze

  validates :first_name, :last_name, :email, :status, :joined_at, presence: true
  validates :member_kind, inclusion: { in: MEMBER_KINDS }
  validates :membership_type, inclusion: { in: MEMBERSHIP_TYPES }

  enum :status, { active: "active", inactive: "inactive" }, validate: true

  def ai?
    member_kind == "ai"
  end

  def effective?
    membership_type == "effective"
  end

  def adherent?
    membership_type == "adherent"
  end

  # Returns the avatar URL: ActiveStorage attachment first, then fallback to the legacy string column
  def avatar_url
    if avatar_image.attached?
      Rails.application.routes.url_helpers.rails_blob_url(avatar_image, only_path: true)
    elsif avatar.present?
      avatar
    end
  end

  def role_names
    member_roles.pluck(:role)
  end

  def guild_ids_list
    guild_memberships.pluck(:guild_id)
  end
end
