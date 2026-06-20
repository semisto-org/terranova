module Design
  # Calendrier de design unifié (#161) : remplace Design::HarvestCalendar et
  # Design::MaintenanceCalendar (schéma strictement identique) par une seule
  # table discriminée par `calendar_type`. Un projet a au plus un calendrier de
  # chaque type (index unique (project_id, calendar_type)).
  class Calendar < ApplicationRecord
    self.table_name = "design_calendars"

    CALENDAR_TYPES = %w[harvest maintenance].freeze

    belongs_to :project, class_name: "Design::Project"

    validates :calendar_type, presence: true, inclusion: { in: CALENDAR_TYPES }
    validates :project_id, uniqueness: { scope: :calendar_type }
  end
end
