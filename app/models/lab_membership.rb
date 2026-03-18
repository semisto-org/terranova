class LabMembership < ApplicationRecord
  belongs_to :lab
  belongs_to :member

  validates :member_id, uniqueness: { scope: :lab_id }
end
