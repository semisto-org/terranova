# frozen_string_literal: true

module Strategy
  class DeliberationComment < ApplicationRecord
    self.table_name = "strategy_deliberation_comments"

    belongs_to :deliberation, class_name: "Strategy::Deliberation"
    belongs_to :author, class_name: "Member", optional: true

    validates :content, presence: true

    scope :ordered, -> { order(created_at: :asc) }

    def as_json_brief
      {
        id: id,
        deliberationId: deliberation_id,
        authorId: author_id,
        authorName: author ? "#{author.first_name} #{author.last_name}" : nil,
        authorAvatar: author&.avatar_url,
        content: content,
        createdAt: created_at&.iso8601
      }
    end
  end
end
