# frozen_string_literal: true

module Strategy
  class DeliberationComment < ApplicationRecord
    self.table_name = "strategy_deliberation_comments"

    belongs_to :deliberation, class_name: "Strategy::Deliberation"
    belongs_to :author, class_name: "Member", optional: true

    validates :content, presence: true

    before_create :set_phase_at_creation

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

    private

    def set_phase_at_creation
      # If phase_at_creation was explicitly set, keep it; otherwise use deliberation's status
      # Since there's no DB default, if it's not in changed_attributes, it's nil and wasn't set
      unless changed_attributes.key?("phase_at_creation")
        self.phase_at_creation = deliberation&.status || "draft"
      end
    end
  end
end
