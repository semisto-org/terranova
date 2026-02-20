# frozen_string_literal: true

class KnowledgeTopicEditor < ApplicationRecord
  belongs_to :topic, class_name: "KnowledgeTopic"
  belongs_to :user, class_name: "Member"

  validates :user_id, uniqueness: { scope: :topic_id }
end
