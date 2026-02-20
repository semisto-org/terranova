module Design
  class ProjectTimesheet < ApplicationRecord
    include SoftDeletable
    self.table_name = 'design_project_timesheets'

    MODES = %w[billed semos].freeze

    belongs_to :project, class_name: 'Design::Project'

    validates :member_id, :member_name, :date, :phase, :mode, presence: true
    validates :mode, inclusion: { in: MODES }
  end
end
