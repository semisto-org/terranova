# frozen_string_literal: true

class KnowledgeBookmark < ApplicationRecord
  belongs_to :user, class_name: "Member"
  belongs_to :topic, class_name: "KnowledgeTopic"

  validates :topic_id, uniqueness: { scope: :user_id }
end
