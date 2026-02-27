# frozen_string_literal: true

module Strategy
  class Deliberation < ApplicationRecord
    self.table_name = "strategy_deliberations"

    STATUSES = %w[open in_progress decided archived].freeze
    DECISION_MODES = %w[consent vote advisory].freeze

    belongs_to :creator, class_name: "Member", foreign_key: :created_by_id, optional: true

    has_many :proposals, class_name: "Strategy::Proposal", foreign_key: :deliberation_id, dependent: :destroy
    has_many :comments, class_name: "Strategy::DeliberationComment", foreign_key: :deliberation_id, dependent: :destroy

    validates :title, presence: true
    validates :status, presence: true, inclusion: { in: STATUSES }
    validates :decision_mode, inclusion: { in: DECISION_MODES }, allow_blank: true

    scope :by_status, ->(status) { where(status: status) if status.present? }
    scope :search, ->(query) {
      where("title ILIKE :q OR context ILIKE :q", q: "%#{query}%") if query.present?
    }

    def as_json_brief
      {
        id: id,
        title: title,
        status: status,
        decisionMode: decision_mode,
        proposalCount: proposals.count,
        commentCount: comments.count,
        reactionsSummary: reactions_summary,
        createdById: created_by_id,
        creatorName: creator ? "#{creator.first_name} #{creator.last_name}" : nil,
        creatorAvatar: creator&.avatar_url,
        decidedAt: decided_at&.iso8601,
        createdAt: created_at&.iso8601,
        updatedAt: updated_at&.iso8601
      }
    end

    def as_json_full
      as_json_brief.merge(
        context: context,
        outcome: outcome,
        proposals: proposals.includes(:author, reactions: :member).order(:created_at).map(&:as_json_full),
        comments: comments.includes(:author).order(:created_at).map(&:as_json_brief)
      )
    end

    private

    def reactions_summary
      counts = Strategy::Reaction
        .where(proposal_id: proposals.select(:id))
        .group(:position)
        .count
      { consent: counts["consent"] || 0, objection: counts["objection"] || 0, abstain: counts["abstain"] || 0, amendment: counts["amendment"] || 0 }
    end
  end
end
