# frozen_string_literal: true

module Strategy
  class Deliberation < ApplicationRecord
    self.table_name = "strategy_deliberations"

    STATUSES = %w[draft open voting outcome_pending decided cancelled].freeze

    belongs_to :creator, class_name: "Member", foreign_key: :created_by_id, optional: true

    has_many :proposals, class_name: "Strategy::Proposal", foreign_key: :deliberation_id, dependent: :destroy
    has_many :comments, class_name: "Strategy::DeliberationComment", foreign_key: :deliberation_id, dependent: :destroy

    has_many_attached :attachments

    validates :title, presence: true
    validates :status, presence: true, inclusion: { in: STATUSES }

    scope :by_status, ->(status) { where(status: status) if status.present? }
    scope :search, ->(query) {
      where("title ILIKE :q OR context ILIKE :q", q: "%#{query}%") if query.present?
    }
    scope :visible_to, ->(member) {
      member_id = member&.id
      where("status != 'draft' OR created_by_id = ?", member_id)
    }

    def publish!
      raise "Cannot publish without a proposal" unless can_publish?
      update!(status: "open", opened_at: Time.current)
    end

    def transition_to_voting!
      now = Time.current
      update!(status: "voting", voting_started_at: now, voting_deadline: now + 7.days)
    end

    def transition_to_outcome_pending!
      update!(status: "outcome_pending")
    end

    def extend_voting!
      update!(voting_deadline: Time.current + 7.days)
    end

    def cancel!
      raise "Cannot cancel a decided deliberation" if status == "decided"
      update!(status: "cancelled")
    end

    def can_publish?
      status == "draft" && proposals.any?
    end

    def can_manage_attachments?
      %w[draft open].include?(status)
    end

    def discussion_deadline
      raise "opened_at is not set" unless opened_at
      opened_at + 15.days
    end

    def as_json_brief
      {
        id: id,
        title: title,
        status: status,
        proposalCount: proposals.count,
        commentCount: comments.count,
        reactionsSummary: reactions_summary,
        createdById: created_by_id,
        creatorName: creator ? "#{creator.first_name} #{creator.last_name}" : nil,
        creatorAvatar: creator&.avatar_url,
        openedAt: opened_at&.iso8601,
        votingStartedAt: voting_started_at&.iso8601,
        votingDeadline: voting_deadline&.iso8601,
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
        commentsByPhase: comments_grouped_by_phase,
        attachments: attachments.map { |a|
          {
            id: a.id,
            filename: a.filename.to_s,
            url: Rails.application.routes.url_helpers.rails_blob_path(a, only_path: true),
            contentType: a.content_type,
            byteSize: a.byte_size
          }
        }
      )
    end

    private

    def reactions_summary
      counts = Strategy::Reaction
        .where(proposal_id: proposals.select(:id))
        .group(:position)
        .count
      { consent: counts["consent"] || 0, objection: counts["objection"] || 0 }
    end

    def comments_grouped_by_phase
      grouped = comments.includes(:author).order(:created_at).group_by(&:phase_at_creation)
      STATUSES.each_with_object({}) do |phase, acc|
        acc[phase] = (grouped[phase] || []).map(&:as_json_brief)
      end
    end
  end
end
