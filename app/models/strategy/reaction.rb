# frozen_string_literal: true

module Strategy
  class Reaction < ApplicationRecord
    self.table_name = "strategy_reactions"

    POSITIONS = %w[consent objection abstain amendment].freeze

    belongs_to :proposal, class_name: "Strategy::Proposal"
    belongs_to :member, class_name: "Member", optional: true

    validates :position, presence: true, inclusion: { in: POSITIONS }
    validates :member_id, uniqueness: { scope: :proposal_id, message: "a déjà réagi à cette proposition" }

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
  end
end
