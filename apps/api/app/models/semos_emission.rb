class SemosEmission < ApplicationRecord
  belongs_to :wallet
  belongs_to :created_by, class_name: "Member", optional: true

  enum :reason, {
    cotisation_member: "cotisation_member",
    volunteer_work: "volunteer_work",
    provider_fee: "provider_fee",
    peer_review: "peer_review",
    loyalty: "loyalty",
    participation: "participation"
  }, validate: true

  validates :amount, numericality: { greater_than: 0 }
end
