module Design
  class HarvestCalendar < ApplicationRecord
    self.table_name = 'design_harvest_calendars'

    belongs_to :project, class_name: 'Design::Project'
  end
end
