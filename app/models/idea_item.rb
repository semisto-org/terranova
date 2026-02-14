class IdeaItem < ApplicationRecord
  belongs_to :idea_list

  validates :title, presence: true
end
