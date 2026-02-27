# frozen_string_literal: true

module Strategy
  class KeyResult < ApplicationRecord
    self.table_name = "strategy_key_results"

    METRIC_TYPES = %w[percentage number boolean].freeze
    STATUSES = %w[on_track at_risk behind achieved].freeze

    belongs_to :axis, class_name: "Strategy::Axis"

    validates :title, presence: true
    validates :metric_type, inclusion: { in: METRIC_TYPES }
    validates :status, inclusion: { in: STATUSES }

    def as_json_brief
      {
        id: id,
        axisId: axis_id,
        title: title,
        metricType: metric_type,
        targetValue: target_value&.to_f,
        currentValue: current_value&.to_f,
        status: status,
        position: position,
        createdAt: created_at&.iso8601,
        updatedAt: updated_at&.iso8601
      }
    end
  end
end
