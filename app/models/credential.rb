class Credential < ApplicationRecord
  belongs_to :guild
  belongs_to :creator, class_name: "Member", foreign_key: :created_by_id, optional: true

  encrypts :username, :password, :notes

  validates :service_name, presence: true
end
