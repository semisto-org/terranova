# frozen_string_literal: true

module Strategy
  class Reaction < ApplicationRecord
    self.table_name = "strategy_reactions"

    POSITIONS = %w[consent objection].freeze

    belongs_to :proposal, class_name: "Strategy::Proposal"
    belongs_to :member, class_name: "Member", optional: true

    validates :position, presence: true, inclusion: { in: POSITIONS }
    validates :rationale, presence: true, if: -> { position == "objection" }
    validates :member_id, uniqueness: {
      scope: :proposal_id,
      message: "a déjà réagi à cette proposition"
    }

    after_create :extend_voting_on_objection

    def as_json_brief
      {
        id: id,
        proposalId: proposal_id,
        memberId: member_id,
        memberName: member ? "#{member.first_name} #{member.last_name}" : nil,
        memberAvatar: member&.avatar_url,
        position: position,
        rationale: rationale,
        createdAt: created_at&.iso8601
      }
    end

    private

    def extend_voting_on_objection
      return unless position == "objection"
      deliberation = proposal&.deliberation
      return unless deliberation&.status == "voting"
      deliberation.extend_voting!
    end
  end
end
