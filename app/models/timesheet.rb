# frozen_string_literal: true

class Timesheet < ApplicationRecord
  MODES = %w[billed semos].freeze

  belongs_to :design_project, class_name: "Design::Project", optional: true
  belongs_to :training, class_name: "Academy::Training", optional: true
  belongs_to :pole_project, optional: true
  belongs_to :event, optional: true

  validates :member_id, :member_name, :date, presence: true
  validates :mode, inclusion: { in: MODES }, allow_blank: true
end
