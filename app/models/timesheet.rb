# frozen_string_literal: true

class Timesheet < ApplicationRecord
  MODES = %w[billed semos].freeze

  belongs_to :projectable, polymorphic: true, optional: true
  belongs_to :event, optional: true
  belongs_to :service_type, class_name: "TimesheetServiceType", optional: true

  validates :member_id, :member_name, :date, presence: true
  validates :hours, numericality: { greater_than: 0 }
  validates :mode, inclusion: { in: MODES }, allow_blank: true
end
