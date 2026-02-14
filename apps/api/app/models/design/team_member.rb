module Design
  class TeamMember < ApplicationRecord
    self.table_name = 'design_team_members'

    ROLES = %w[project-manager designer butineur].freeze

    belongs_to :project, class_name: 'Design::Project'

    validates :member_id, :member_name, :role, :assigned_at, presence: true
    validates :role, inclusion: { in: ROLES }
  end
end
