module Plant
  class IllustrationJob < ApplicationRecord
    self.table_name = "plant_illustration_jobs"

    STATUSES = %w[pending running completed failed].freeze
    KINDS = %w[initial regeneration].freeze

    belongs_to :species, class_name: "Plant::Species"
    belongs_to :triggered_by, class_name: "Member"

    validates :status, inclusion: { in: STATUSES }
    validates :kind, inclusion: { in: KINDS }
    validates :triggered_at, presence: true

    scope :recent, -> { order(triggered_at: :desc) }
    scope :pending, -> { where(status: "pending") }
    scope :running, -> { where(status: "running") }
    scope :completed, -> { where(status: "completed") }
    scope :failed, -> { where(status: "failed") }

    def pending?;   status == "pending";   end
    def running?;   status == "running";   end
    def completed?; status == "completed"; end
    def failed?;    status == "failed";    end
  end
end
