# frozen_string_literal: true

module Strategy
  class Resource < ApplicationRecord
    self.table_name = "strategy_resources"

    RESOURCE_TYPES = %w[article report reference framework tool].freeze

    belongs_to :creator, class_name: "Member", foreign_key: :created_by_id, optional: true

    has_many_attached :attachments

    validates :title, presence: true
    validates :resource_type, presence: true, inclusion: { in: RESOURCE_TYPES }

    scope :pinned, -> { where(pinned: true) }
    scope :by_type, ->(type) { where(resource_type: type) if type.present? }
    scope :by_tag, ->(tag) { where("tags::text ILIKE ?", "%#{tag}%") if tag.present? }
    scope :search, ->(query) {
      where("title ILIKE :q OR summary ILIKE :q OR content ILIKE :q", q: "%#{query}%") if query.present?
    }

    def as_json_brief
      {
        id: id,
        title: title,
        summary: summary,
        sourceUrl: source_url,
        resourceType: resource_type,
        tags: tags || [],
        pinned: pinned,
        createdById: created_by_id,
        creatorName: creator ? "#{creator.first_name} #{creator.last_name}" : nil,
        creatorAvatar: creator&.avatar_url,
        createdAt: created_at&.iso8601,
        updatedAt: updated_at&.iso8601
      }
    end

    def as_json_full
      as_json_brief.merge(
        content: content,
        attachments: attachments.map { |a|
          { id: a.id, filename: a.filename.to_s, url: Rails.application.routes.url_helpers.rails_blob_path(a, only_path: true), contentType: a.content_type, byteSize: a.byte_size }
        }
      )
    end
  end
end
