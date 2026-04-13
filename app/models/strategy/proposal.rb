# frozen_string_literal: true

module Strategy
  class Proposal < ApplicationRecord
    self.table_name = "strategy_proposals"

    belongs_to :deliberation, class_name: "Strategy::Deliberation"
    belongs_to :author, class_name: "Member", optional: true

    has_many :reactions, class_name: "Strategy::Reaction", foreign_key: :proposal_id, dependent: :destroy
    has_many :versions, class_name: "Strategy::ProposalVersion", foreign_key: :proposal_id, dependent: :destroy

    validates :content, presence: true
    validates :version, presence: true, numericality: { only_integer: true, greater_than: 0 }
    validates :deliberation_id, uniqueness: { message: "a déjà une proposition" }

    after_create :record_initial_version

    def record_new_version!(new_content)
      transaction do
        self.version += 1
        versions.create!(version: self.version, content: new_content)
        update!(content: new_content)
      end
    end

    def as_json_brief
      {
        id: id,
        deliberationId: deliberation_id,
        authorId: author_id,
        authorName: author ? "#{author.first_name} #{author.last_name}" : nil,
        authorAvatar: author&.avatar_url,
        version: version,
        versionsCount: versions.count,
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

    def record_initial_version
      versions.create!(version: version, content: content)
    end

    def reaction_counts
      reactions.group(:position).count
    end
  end
end
