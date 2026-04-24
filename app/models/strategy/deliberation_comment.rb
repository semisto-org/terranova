# frozen_string_literal: true

module Strategy
  class DeliberationComment < ApplicationRecord
    include SanitizesRichText

    self.table_name = "strategy_deliberation_comments"

    belongs_to :deliberation, class_name: "Strategy::Deliberation"
    belongs_to :author, class_name: "Member", optional: true
    belongs_to :parent, class_name: "Strategy::DeliberationComment", optional: true

    has_many :replies,
      class_name: "Strategy::DeliberationComment",
      foreign_key: :parent_id,
      dependent: :destroy
    has_many :reactions,
      class_name: "Strategy::CommentReaction",
      foreign_key: :comment_id,
      dependent: :destroy

    validates :content, presence: true, unless: :deleted?
    validate :parent_must_be_root
    validate :parent_must_belong_to_same_deliberation

    sanitizes_rich_text :content

    before_create :set_phase_at_creation

    scope :ordered, -> { order(created_at: :asc) }
    scope :root, -> { where(parent_id: nil) }

    def deleted?
      deleted_at.present?
    end

    def soft_delete!
      if replies.any?
        update!(deleted_at: Time.current, content: "[deleted]")
      else
        destroy!
      end
    end

    def as_json_brief(current_member: nil)
      base = {
        id: id,
        deliberationId: deliberation_id,
        parentId: parent_id,
        authorId: author_id,
        authorName: author ? "#{author.first_name} #{author.last_name}" : nil,
        authorAvatar: author&.avatar_url,
        content: deleted? ? nil : content,
        isDeleted: deleted?,
        editedAt: edited_at&.iso8601,
        createdAt: created_at&.iso8601,
        reactions: reactions_payload(current_member: current_member)
      }

      # Root-only extras
      if parent_id.nil?
        base[:replyCount] = replies.count
        base[:replyParticipants] = reply_participants_payload
      end

      base
    end

    private

    def reactions_payload(current_member: nil)
      Strategy::CommentReaction::EMOJIS.map do |emoji|
        matching = reactions.select { |r| r.emoji == emoji }
        next nil if matching.empty?

        members = matching.map(&:member).compact
        {
          emoji: emoji,
          count: matching.size,
          memberNames: members.map { |m| "#{m.first_name} #{m.last_name}".strip },
          reactedByMe: current_member ? matching.any? { |r| r.member_id == current_member.id } : false
        }
      end.compact
    end

    def reply_participants_payload
      replies
        .includes(:author)
        .order(:created_at)
        .map(&:author)
        .compact
        .uniq
        .first(3)
        .map { |m| { id: m.id, name: "#{m.first_name} #{m.last_name}".strip, avatar: m.avatar_url } }
    end

    def parent_must_be_root
      return if parent.nil?
      return if parent.parent_id.nil?

      errors.add(:parent_id, "must be a root comment (no nested replies beyond 2 levels)")
    end

    def parent_must_belong_to_same_deliberation
      return if parent.nil?
      return if parent.deliberation_id == deliberation_id

      errors.add(:parent_id, "must belong to the same deliberation")
    end

    def set_phase_at_creation
      unless changed_attributes.key?("phase_at_creation")
        self.phase_at_creation = deliberation&.status || "draft"
      end
    end
  end
end
