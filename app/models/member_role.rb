class MemberRole < ApplicationRecord
  belongs_to :member

  ROLES = %w[admin designer shaper formateur comptable coordination communication IT autre].freeze

  validates :role, presence: true, inclusion: { in: ROLES }
end
