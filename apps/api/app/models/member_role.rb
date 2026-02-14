class MemberRole < ApplicationRecord
  belongs_to :member

  ROLES = %w[designer shaper formateur comptable coordination communication IT].freeze

  validates :role, presence: true, inclusion: { in: ROLES }
end
