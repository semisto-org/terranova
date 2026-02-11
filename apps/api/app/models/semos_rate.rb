class SemosRate < ApplicationRecord
  enum :rate_type, {
    cotisation_member_active: "cotisation_member_active",
    cotisation_member_support: "cotisation_member_support",
    volunteer_hourly: "volunteer_hourly",
    provider_fee_percentage: "provider_fee_percentage",
    peer_review: "peer_review"
  }, validate: true

  validates :amount, presence: true
end
