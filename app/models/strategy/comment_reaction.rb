# frozen_string_literal: true

module Strategy
  class CommentReaction < ApplicationRecord
    self.table_name = "strategy_comment_reactions"

    EMOJIS = %w[thumbs_up bulb question heart].freeze

    belongs_to :comment, class_name: "Strategy::DeliberationComment"
    belongs_to :member

    validates :emoji, presence: true, inclusion: { in: EMOJIS }
    validates :member_id, uniqueness: { scope: [:comment_id, :emoji] }
  end
end
