class IdeaList < ApplicationRecord
  has_many :idea_items, dependent: :destroy

  validates :name, presence: true
end
