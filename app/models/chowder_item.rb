class ChowderItem < ApplicationRecord
  belongs_to :pitch
  belongs_to :created_by, class_name: "Member", optional: true

  validates :title, presence: true
end
