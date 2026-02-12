module Design
  class Project < ApplicationRecord
    self.table_name = 'design_projects'

    PHASES = %w[offre pre-projet projet-detaille mise-en-oeuvre co-gestion].freeze
    STATUSES = %w[active pending completed archived].freeze

    belongs_to :template, class_name: 'Design::ProjectTemplate', optional: true
    has_many :meetings, class_name: 'Design::ProjectMeeting', foreign_key: :project_id, dependent: :destroy
    has_many :team_members, class_name: 'Design::TeamMember', foreign_key: :project_id, dependent: :destroy
    has_many :timesheets, class_name: 'Design::ProjectTimesheet', foreign_key: :project_id, dependent: :destroy
    has_many :expenses, class_name: 'Design::Expense', foreign_key: :project_id, dependent: :destroy
    has_one :site_analysis, class_name: 'Design::SiteAnalysis', foreign_key: :project_id, dependent: :destroy
    has_one :palette, class_name: 'Design::ProjectPalette', foreign_key: :project_id, dependent: :destroy
    has_many :quotes, class_name: 'Design::Quote', foreign_key: :project_id, dependent: :destroy
    has_many :documents, class_name: 'Design::ProjectDocument', foreign_key: :project_id, dependent: :destroy
    has_many :media_items, class_name: 'Design::MediaItem', foreign_key: :project_id, dependent: :destroy
    has_many :annotations, class_name: 'Design::Annotation', foreign_key: :project_id, dependent: :destroy
    has_one :client_contribution, class_name: 'Design::ClientContribution', foreign_key: :project_id, dependent: :destroy
    has_one :harvest_calendar, class_name: 'Design::HarvestCalendar', foreign_key: :project_id, dependent: :destroy
    has_one :maintenance_calendar, class_name: 'Design::MaintenanceCalendar', foreign_key: :project_id, dependent: :destroy

    validates :name, :client_id, :client_name, :phase, :status, presence: true
    validates :phase, inclusion: { in: PHASES }
    validates :status, inclusion: { in: STATUSES }
  end
end
