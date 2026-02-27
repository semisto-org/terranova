# frozen_string_literal: true

module Strategy
  class Proposal < ApplicationRecord
    self.table_name = "strategy_proposals"

    STATUSES = %w[pending accepted amended withdrawn].freeze

    belongs_to :deliberation, class_name: "Strategy::Deliberation"
    belongs_to :author, class_name: "Member", optional: true

    has_many :reactions, class_name: "Strategy::Reaction", foreign_key: :proposal_id, dependent: :destroy

    validates :content, presence: true
    validates :status, inclusion: { in: STATUSES }

    def as_json_brief
      {
        id: id,
        deliberationId: deliberation_id,
        authorId: author_id,
        authorName: author ? "#{author.first_name} #{author.last_name}" : nil,
        authorAvatar: author&.avatar_url,
        status: status,
        reactionCounts: reaction_counts,
        createdAt: created_at&.iso8601,
        updatedAt: updated_at&.iso8601
      }
    end

    def as_json_full
      as_json_brief.merge(
        content: content,
        reactions: reactions.includes(:member).map(&:as_json_brief)
      )
    end

    private

    def reaction_counts
      reactions.group(:position).count
    end
  end
end
