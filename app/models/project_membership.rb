# frozen_string_literal: true

class ProjectMembership < ApplicationRecord
  ROLES = %w[lead member organizer project-manager designer butineur].freeze

  belongs_to :projectable, polymorphic: true
  belongs_to :member

  validates :member_id, uniqueness: { scope: [:projectable_type, :projectable_id, :role] }
  validates :role, inclusion: { in: ROLES }, allow_nil: true
end
