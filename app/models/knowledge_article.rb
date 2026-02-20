# frozen_string_literal: true

class KnowledgeArticle < ApplicationRecord
  CATEGORIES = %w[research regulation funding strategy technical other].freeze
  STATUSES = %w[draft published archived].freeze
  POLES = %w[academy design nursery roots].freeze

  validates :title, presence: true
  validates :content, presence: true
  validates :category, inclusion: { in: CATEGORIES }
  validates :status, inclusion: { in: STATUSES }
  validates :pole, inclusion: { in: POLES }, allow_nil: true, allow_blank: true

  scope :published, -> { where(status: "published") }
  scope :archived, -> { where(status: "archived") }
  scope :drafts, -> { where(status: "draft") }
  scope :pinned, -> { where(pinned: true) }
  scope :by_category, ->(cat) { where(category: cat) if cat.present? }
  scope :by_pole, ->(pole) { where(pole: pole) if pole.present? }
  scope :by_lab, ->(lab_id) { where(lab_id: lab_id) if lab_id.present? }
  scope :search, ->(query) {
    where("title ILIKE :q OR content ILIKE :q OR summary ILIKE :q", q: "%#{query}%") if query.present?
  }
  scope :by_tag, ->(tag) {
    where("tags::text ILIKE ?", "%#{tag}%") if tag.present?
  }

  def as_json_brief
    {
      id: id,
      title: title,
      summary: summary,
      category: category,
      tags: tags || [],
      pole: pole,
      pinned: pinned,
      status: status,
      authorName: author_name,
      labId: lab_id,
      sourceUrl: source_url,
      createdAt: created_at&.iso8601,
      updatedAt: updated_at&.iso8601
    }
  end

  def as_json_full
    as_json_brief.merge(content: content)
  end
end
