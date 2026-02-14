class SemosTransaction < ApplicationRecord
  belongs_to :from_wallet, class_name: "Wallet"
  belongs_to :to_wallet, class_name: "Wallet"

  enum :transaction_type, {
    payment: "payment",
    transfer: "transfer",
    exchange: "exchange"
  }, validate: true

  validates :amount, numericality: { greater_than: 0 }
end
