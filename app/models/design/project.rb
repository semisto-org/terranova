module Design
  class Project < ApplicationRecord
    include SoftDeletable
    self.table_name = 'design_projects'

    PHASES = %w[offre pre-projet projet-detaille mise-en-oeuvre co-gestion termine].freeze
    STATUSES = %w[active pending completed archived].freeze
    PROJECT_TYPES = %w[prive professionnel collectif public].freeze
    CLIENT_INTERESTS = %w[
      design
      plant_selection
      personalized_coaching
      implementation_support
      five_year_follow_up
    ].freeze
    ACQUISITION_CHANNELS = %w[bouche_a_oreille presse autre].freeze

    belongs_to :template, class_name: 'Design::ProjectTemplate', optional: true
    has_many :meetings, class_name: 'Design::ProjectMeeting', foreign_key: :project_id, dependent: :destroy
    has_many :team_members, class_name: 'Design::TeamMember', foreign_key: :project_id, dependent: :destroy
    has_many :timesheets, class_name: 'Design::ProjectTimesheet', foreign_key: :project_id, dependent: :destroy
    has_many :expenses, class_name: "Expense", foreign_key: :design_project_id, dependent: :destroy
    has_one :site_analysis, class_name: 'Design::SiteAnalysis', foreign_key: :project_id, dependent: :destroy
    has_one :palette, class_name: 'Design::ProjectPalette', foreign_key: :project_id, dependent: :destroy
    has_many :quotes, class_name: 'Design::Quote', foreign_key: :project_id, dependent: :destroy
    has_many :documents, class_name: 'Design::ProjectDocument', foreign_key: :project_id, dependent: :destroy
    has_many :media_items, class_name: 'Design::MediaItem', foreign_key: :project_id, dependent: :destroy
    has_many :annotations, class_name: 'Design::Annotation', foreign_key: :project_id, dependent: :destroy
    has_one :client_contribution, class_name: 'Design::ClientContribution', foreign_key: :project_id, dependent: :destroy
    has_one :harvest_calendar, class_name: 'Design::HarvestCalendar', foreign_key: :project_id, dependent: :destroy
    has_one :maintenance_calendar, class_name: 'Design::MaintenanceCalendar', foreign_key: :project_id, dependent: :destroy
    has_one :planting_plan, class_name: 'Design::PlantingPlan', foreign_key: :project_id, dependent: :destroy
    has_many :plant_records, class_name: 'Design::PlantRecord', foreign_key: :project_id, dependent: :destroy
    has_many :follow_up_visits, class_name: 'Design::FollowUpVisit', foreign_key: :project_id, dependent: :destroy
    has_many :interventions, class_name: 'Design::Intervention', foreign_key: :project_id, dependent: :destroy
    has_many :task_lists, class_name: 'Design::TaskList', foreign_key: :project_id, dependent: :destroy
    has_one :album, as: :albumable, dependent: :destroy

    before_validation :normalize_client_interests

    validates :name, :client_id, :client_name, :phase, :status, presence: true
    validates :phase, inclusion: { in: PHASES }
    validates :status, inclusion: { in: STATUSES }
    validate :project_type_is_supported_when_provided
    validates :acquisition_channel, inclusion: { in: ACQUISITION_CHANNELS }, allow_blank: true
    validate :client_interests_are_supported

    def address_display
      parts = [street, number, postcode, city, country_name].reject(&:blank?)
      parts.join(', ')
    end

    def ensure_client_portal_token!
      return client_portal_token if client_portal_token.present?

      loop do
        self.client_portal_token = SecureRandom.urlsafe_base64(12)[0, 16]
        break unless Design::Project.exists?(client_portal_token: client_portal_token)
      end
      save!
      client_portal_token
    end

    private

    def normalize_client_interests
      self.client_interests = Array(client_interests).map(&:to_s).reject(&:blank?).uniq
    end

    def client_interests_are_supported
      unsupported = Array(client_interests).map(&:to_s) - CLIENT_INTERESTS
      return if unsupported.empty?

      errors.add(:client_interests, "contains unsupported values: #{unsupported.join(', ')}")
    end

    def project_type_is_supported_when_provided
      value = project_type.to_s
      return if value.blank?
      return if PROJECT_TYPES.include?(value)
      return unless will_save_change_to_project_type?

      errors.add(:project_type, 'is not included in the list')
    end
  end
end
