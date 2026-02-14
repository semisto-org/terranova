module Design
  class MaintenanceCalendar < ApplicationRecord
    self.table_name = 'design_maintenance_calendars'

    belongs_to :project, class_name: 'Design::Project'
  end
end
