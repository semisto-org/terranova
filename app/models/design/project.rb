module Design
  class Project < ApplicationRecord
    include SoftDeletable
    include Projectable
    self.table_name = 'design_projects'

    PHASES = %w[offre pre-projet projet-detaille mise-en-oeuvre co-gestion termine].freeze
    STATUSES = %w[active pending completed archived].freeze
    PROJECT_TYPES = %w[prive professionnel collectif public].freeze

    # Délibération #20 — quatre formats de projet reconnus, chacun portant son taux.
    #   a = Projet Semisto standard (binôme + budget ≥ 5 000 €)  → rétrocession 15 %
    #   b = Petit projet Semisto (1 designer rémunéré + bénévoles, < 5 000 €) → rétrocession 15 %
    #   c = Collaboration facilitée pour client hors mission → commission 5 %
    #   d = Projet personnel du designer → hors Semisto (0 %)
    FORMAT_CODES = %w[a b c d].freeze
    FORMAT_DEFAULT_RETROCESSION = { 'a' => 0.15, 'b' => 0.15, 'c' => 0.05, 'd' => 0.0 }.freeze
    # Bornes du taux horaire designer fixées par la délibération.
    DESIGNER_RATE_MIN = 40
    DESIGNER_RATE_MAX = 60
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
    has_many :methodology_items, class_name: 'Design::MethodologyItem', foreign_key: :project_id, dependent: :destroy
    has_one :album, as: :albumable, dependent: :destroy

    before_validation :normalize_client_interests

    validates :name, :client_id, :client_name, :phase, :status, presence: true
    validates :phase, inclusion: { in: PHASES }
    validates :status, inclusion: { in: STATUSES }
    validate :project_type_is_supported_when_provided
    validates :acquisition_channel, inclusion: { in: ACQUISITION_CHANNELS }, allow_blank: true
    validate :client_interests_are_supported
    validates :google_photos_url, format: { with: /\Ahttps?:\/\//i }, allow_blank: true
    validates :format_code, inclusion: { in: FORMAT_CODES }, allow_blank: true
    validates :designer_rate,
              numericality: { greater_than_or_equal_to: DESIGNER_RATE_MIN, less_than_or_equal_to: DESIGNER_RATE_MAX },
              allow_nil: true
    validates :retrocession_rate,
              numericality: { greater_than_or_equal_to: 0, less_than: 1 },
              allow_nil: true

    before_save :stamp_closed_at

    # Taux horaire designer effectif (tarif client aligné). Défaut : taux global BillingConfig.
    def effective_designer_rate
      designer_rate.presence || BillingConfig.instance.hourly_rate
    end

    # Taux de rétrocession effectif : explicite > défaut du format > taux global transitoire.
    def effective_retrocession_rate
      return retrocession_rate if retrocession_rate.present?
      return FORMAT_DEFAULT_RETROCESSION[format_code] if format_code.present?

      BillingConfig.instance.asbl_support_rate
    end

    def address_display
      parts = [street, number, postcode, city, country_name].reject(&:blank?)
      parts.join(', ')
    end

    # Avancement méthodologique par étape, dérivé de la définition + des items 'done'.
    # => { "observation" => { done: 1, total: 10, percent: 10 }, ... }
    def methodology_progress
      done_keys = methodology_items.where(status: 'done').pluck(:node_key).to_set

      Design::Methodology.tree.each_with_object({}) do |step, acc|
        leaf_keys = Design::Methodology.leaf_keys_for_step(step[:key])
        total = leaf_keys.size
        done = leaf_keys.count { |key| done_keys.include?(key) }
        percent = total.zero? ? 0 : ((done.to_f / total) * 100).round
        acc[step[:key]] = { done: done, total: total, percent: percent }
      end
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

    # Horodate la clôture quand le projet passe en "completed" ; efface si on rouvre.
    def stamp_closed_at
      return unless will_save_change_to_status?

      if status == 'completed'
        self.closed_at ||= Time.current
      elsif status_was == 'completed'
        self.closed_at = nil
      end
    end

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
