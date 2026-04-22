# frozen_string_literal: true

module BankSync
  # Imports Stripe balance_transactions into BankTransaction records on a
  # BankConnection whose provider='stripe'. We import:
  #   - type='charge'  → credit (customer paid)
  #   - type='payout'  → debit (money sent from Stripe balance to bank)
  # and SKIP:
  #   - type='stripe_fee' (handled via the monthly Stripe invoice booked as an Expense)
  class StripeImporter
    SUPPORTED_TYPES = %w[charge payout].freeze

    def initialize(connection)
      @connection = connection
      raise ArgumentError, "Connection must be provider='stripe'" unless connection.provider == "stripe"
    end

    # Imports balance transactions since `since_time` (defaults to 90 days ago
    # or the last successful sync). Returns counts.
    def import(since: nil)
      since_time = since || @connection.last_synced_at || 90.days.ago

      imported = 0
      skipped = 0
      errors = 0

      Stripe::BalanceTransaction.list(
        created: { gte: since_time.to_i },
        expand: ["data.source"],
        limit: 100
      ).auto_paging_each do |bt|
        next unless SUPPORTED_TYPES.include?(bt.type)

        begin
          existing = BankTransaction.find_by(provider_transaction_id: bt.id)
          if existing
            skipped += 1
            next
          end

          BankTransaction.create!(build_attributes_from_bt(bt))
          imported += 1
        rescue ActiveRecord::RecordInvalid, Stripe::StripeError => e
          errors += 1
          Rails.logger.warn("StripeImporter failed on #{bt.id}: #{e.message}")
        end
      end

      @connection.update!(last_synced_at: Time.current)
      { imported: imported, skipped: skipped, errors: errors }
    end

    private

    def build_attributes_from_bt(bt)
      source = bt.source
      charge = bt.type == "charge" ? source : nil
      payout = bt.type == "payout" ? source : nil

      {
        bank_connection: @connection,
        provider_transaction_id: bt.id,
        date: Time.at(bt.created).to_date,
        booking_date: bt.available_on ? Time.at(bt.available_on).to_date : Time.at(bt.created).to_date,
        amount: (bt.net.to_f / 100).round(2), # net amount (after fees for charges; amount for payouts)
        currency: bt.currency.to_s.upcase,
        counterpart_name: counterpart_for(bt.type, charge, payout),
        remittance_info: remittance_for(bt.type, charge, payout),
        internal_reference: charge&.payment_intent || payout&.id,
        status: "unmatched"
      }
    end

    def counterpart_for(type, charge, payout)
      case type
      when "charge"
        charge&.billing_details&.name ||
          charge&.billing_details&.email ||
          charge&.metadata&.[]("contact_name") ||
          "Client Stripe"
      when "payout"
        "Payout Stripe → banque"
      else
        "Stripe"
      end
    end

    def remittance_for(type, charge, payout)
      case type
      when "charge"
        charge&.description || charge&.metadata&.[]("training_id").then { |tid| tid ? "Inscription training #{tid}" : nil } || "Charge Stripe"
      when "payout"
        "Virement groupé Stripe"
      else
        nil
      end
    end
  end
end
