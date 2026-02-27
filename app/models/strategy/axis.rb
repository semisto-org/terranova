# frozen_string_literal: true

module Strategy
  class Axis < ApplicationRecord
    self.table_name = "strategy_axes"

    STATUSES = %w[active paused achieved abandoned].freeze

    belongs_to :creator, class_name: "Member", foreign_key: :created_by_id, optional: true

    has_many :key_results, class_name: "Strategy::KeyResult", foreign_key: :axis_id, dependent: :destroy

    validates :title, presence: true
    validates :status, inclusion: { in: STATUSES }
    validates :progress, numericality: { in: 0..100 }

    scope :by_status, ->(status) { where(status: status) if status.present? }
    scope :ordered, -> { order(position: :asc, created_at: :desc) }

    def as_json_brief
      {
        id: id,
        title: title,
        description: description,
        status: status,
        targetYear: target_year,
        progress: progress,
        color: color,
        position: position,
        keyResultCount: key_results.count,
        createdById: created_by_id,
        creatorName: creator ? "#{creator.first_name} #{creator.last_name}" : nil,
        createdAt: created_at&.iso8601,
        updatedAt: updated_at&.iso8601
      }
    end

    def as_json_full
      as_json_brief.merge(
        keyResults: key_results.order(:position, :created_at).map(&:as_json_brief)
      )
    end
  end
end
