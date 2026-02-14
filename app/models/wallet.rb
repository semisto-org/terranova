class Wallet < ApplicationRecord
  belongs_to :member

  has_many :outgoing_transactions,
    class_name: "SemosTransaction",
    foreign_key: :from_wallet_id,
    dependent: :destroy,
    inverse_of: :from_wallet

  has_many :incoming_transactions,
    class_name: "SemosTransaction",
    foreign_key: :to_wallet_id,
    dependent: :destroy,
    inverse_of: :to_wallet

  has_many :semos_emissions, dependent: :destroy

  validates :balance, :floor, :ceiling, presence: true
end
