# frozen_string_literal: true

class TimesheetServiceType < ApplicationRecord
  include SoftDeletable

  has_many :design_project_timesheets, class_name: "Design::ProjectTimesheet", foreign_key: :service_type_id, dependent: :nullify
  has_many :timesheets, dependent: :nullify

  validates :label, presence: true, uniqueness: true

  scope :ordered, -> { order(label: :asc) }
end
