# frozen_string_literal: true

class KnowledgeComment < ApplicationRecord
  belongs_to :topic, class_name: "KnowledgeTopic"
  belongs_to :user, class_name: "Member", optional: true

  validates :content, presence: true

  scope :ordered, -> { order(created_at: :asc) }

  def as_json_brief
    {
      id: id,
      topicId: topic_id,
      userId: user_id,
      authorName: author_name || (user ? "#{user.first_name} #{user.last_name}" : "Anonyme"),
      authorAvatar: user&.avatar_url,
      content: content,
      createdAt: created_at&.iso8601
    }
  end
end
