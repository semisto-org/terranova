# frozen_string_literal: true

class KnowledgeTopic < ApplicationRecord
  STATUSES = %w[draft published archived].freeze

  belongs_to :section, class_name: "KnowledgeSection", optional: true
  belongs_to :creator, class_name: "Member", foreign_key: :created_by_id, optional: true

  has_many :topic_editors, class_name: "KnowledgeTopicEditor", foreign_key: :topic_id, dependent: :destroy
  has_many :editors, through: :topic_editors, source: :user

  has_many :bookmarks, class_name: "KnowledgeBookmark", foreign_key: :topic_id, dependent: :destroy
  has_many :revisions, class_name: "KnowledgeTopicRevision", foreign_key: :topic_id, dependent: :destroy
  has_many :comments, class_name: "KnowledgeComment", foreign_key: :topic_id, dependent: :destroy

  has_many_attached :attachments

  validates :title, presence: true
  validates :content, presence: true
  validates :status, inclusion: { in: STATUSES }

  before_save :compute_reading_time

  scope :published, -> { where(status: "published") }
  scope :archived, -> { where(status: "archived") }
  scope :drafts, -> { where(status: "draft") }
  scope :pinned, -> { where(pinned: true) }
  scope :by_section, ->(section_id) { where(section_id: section_id) if section_id.present? }
  scope :by_tag, ->(tag) { where("tags::text ILIKE ?", "%#{tag}%") if tag.present? }
  scope :search, ->(query) {
    where("title ILIKE :q OR content ILIKE :q", q: "%#{query}%") if query.present?
  }

  scope :visible_to, ->(member) {
    if member
      where("status = 'published' OR (status = 'draft' AND created_by_id = ?)", member.id)
    else
      published
    end
  }

  def as_json_brief(current_member: nil)
    {
      id: id,
      title: title,
      tags: tags || [],
      pinned: pinned,
      status: status,
      authorName: author_name,
      sectionId: section_id,
      sectionName: section&.name,
      readingTimeMinutes: reading_time_minutes,
      createdById: created_by_id,
      creatorName: creator ? "#{creator.first_name} #{creator.last_name}" : author_name,
      creatorAvatar: creator&.avatar_url,
      editors: topic_editors.includes(:user).map { |te|
        { firstName: te.user.first_name, avatarUrl: te.user.avatar_url, editedAt: te.edited_at&.iso8601 }
      },
      bookmarked: current_member ? bookmarks.exists?(user_id: current_member.id) : false,
      commentsCount: comments.count,
      createdAt: created_at&.iso8601,
      updatedAt: updated_at&.iso8601
    }
  end

  def as_json_full(current_member: nil)
    as_json_brief(current_member: current_member).merge(
      content: content,
      attachments: attachments.map { |a|
        { id: a.id, filename: a.filename.to_s, url: Rails.application.routes.url_helpers.rails_blob_path(a, only_path: true), contentType: a.content_type, byteSize: a.byte_size }
      }
    )
  end

  def related_topics(limit = 5)
    clean_tags = Array(tags).select(&:present?)
    return self.class.none if clean_tags.empty?

    quoted_tags = clean_tags.map { |t| ActiveRecord::Base.connection.quote(t) }
    pg_array_literal = "ARRAY[#{quoted_tags.join(',')}]::text[]"

    self.class
      .published
      .where.not(id: id)
      .where("tags ?| #{pg_array_literal}")
      .select(Arel.sql("knowledge_topics.*, (SELECT COUNT(*) FROM jsonb_array_elements_text(knowledge_topics.tags) AS t WHERE t = ANY(#{pg_array_literal})) AS common_tags_count"))
      .order(Arel.sql("common_tags_count DESC"))
      .limit(limit)
  rescue StandardError => e
    Rails.logger.error("[KnowledgeTopic#related_topics] Error for topic #{id}: #{e.message}")
    self.class.none
  end

  private

  def compute_reading_time
    word_count = ActionController::Base.helpers.strip_tags(content.to_s).split.size
    self.reading_time_minutes = [1, (word_count / 200.0).ceil].max
  end
end
