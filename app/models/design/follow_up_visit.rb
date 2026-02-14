module Design
  class FollowUpVisit < ApplicationRecord
    self.table_name = 'design_follow_up_visits'

    TYPES = %w[follow-up intervention client-meeting].freeze

    belongs_to :project, class_name: 'Design::Project'

    validates :date, :visit_type, presence: true
    validates :visit_type, inclusion: { in: TYPES }
  end
end
