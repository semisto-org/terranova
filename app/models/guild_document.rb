class GuildDocument < ApplicationRecord
  belongs_to :guild
  belongs_to :uploader, class_name: "Member", foreign_key: :uploaded_by_id, optional: true

  has_one_attached :file

  validates :name, presence: true
  validates :file, presence: true

  scope :by_tag, ->(tag) { where("tags::text ILIKE ?", "%#{tag}%") if tag.present? }
end
