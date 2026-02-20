# frozen_string_literal: true

class KnowledgeTopicRevision < ApplicationRecord
  belongs_to :topic, class_name: "KnowledgeTopic"
  belongs_to :user, class_name: "Member", optional: true

  def as_json_brief
    {
      id: id,
      userId: user_id,
      userName: user_name || (user ? "#{user.first_name} #{user.last_name}" : "Inconnu"),
      changes: changes_data,
      createdAt: created_at&.iso8601
    }
  end
end
