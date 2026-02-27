# frozen_string_literal: true

module Strategy
  class Framework < ApplicationRecord
    self.table_name = "strategy_frameworks"

    FRAMEWORK_TYPES = %w[charter protocol decision_matrix role_definition].freeze
    STATUSES = %w[draft active superseded archived].freeze

    belongs_to :deliberation, class_name: "Strategy::Deliberation", optional: true
    belongs_to :creator, class_name: "Member", foreign_key: :created_by_id, optional: true

    has_many_attached :attachments

    validates :title, presence: true
    validates :content, presence: true
    validates :framework_type, presence: true, inclusion: { in: FRAMEWORK_TYPES }
    validates :status, inclusion: { in: STATUSES }

    scope :by_type, ->(type) { where(framework_type: type) if type.present? }
    scope :by_status, ->(status) { where(status: status) if status.present? }
    scope :search, ->(query) {
      where("title ILIKE :q OR content ILIKE :q", q: "%#{query}%") if query.present?
    }

    def as_json_brief
      {
        id: id,
        title: title,
        frameworkType: framework_type,
        status: status,
        version: version,
        deliberationId: deliberation_id,
        deliberationTitle: deliberation&.title,
        createdById: created_by_id,
        creatorName: creator ? "#{creator.first_name} #{creator.last_name}" : nil,
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
