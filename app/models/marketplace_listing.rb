class MarketplaceListing < ApplicationRecord
  belongs_to :member

  has_many_attached :images

  enum :category, { product: "product", service: "service" }, validate: true
  enum :status, { active: "active", paused: "paused" }, validate: true

  validates :title, presence: true, length: { maximum: 200 }
  validates :description, length: { maximum: 5000 }
  validates :price_semos, presence: true, numericality: { greater_than: 0, only_integer: true }

  scope :visible, -> { where(deleted_at: nil, status: :active) }
  scope :by_member, ->(member_id) { where(member_id: member_id) }

  def soft_delete!
    update!(deleted_at: Time.current)
  end
end
