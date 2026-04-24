# frozen_string_literal: true

module Strategy
  class ProposalVersion < ApplicationRecord
    include SanitizesRichText

    self.table_name = "strategy_proposal_versions"

    belongs_to :proposal, class_name: "Strategy::Proposal"

    validates :version, presence: true, numericality: { only_integer: true, greater_than: 0 }
    validates :content, presence: true

    sanitizes_rich_text :content

    scope :chronological, -> { order(:version) }

    def as_json_brief
      {
        id: id,
        proposalId: proposal_id,
        version: version,
        content: content,
        createdAt: created_at&.iso8601
      }
    end
  end
end
