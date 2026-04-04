# frozen_string_literal: true

module BankSync
  class TransactionImporter
    attr_reader :bank_connection, :imported_count, :skipped_count

    def initialize(bank_connection)
      @bank_connection = bank_connection
      @imported_count = 0
      @skipped_count = 0
    end

    def import(date_from: nil, date_to: nil)
      date_from ||= last_sync_date
      date_to ||= Date.current

      client = GocardlessClient.new
      response = client.get_transactions(
        bank_connection.provider_account_id,
        date_from: date_from,
        date_to: date_to
      )

      transactions = response.dig("transactions", "booked") || []

      ActiveRecord::Base.transaction do
        transactions.each do |tx_data|
          import_transaction(tx_data)
        end

        bank_connection.update!(last_synced_at: Time.current)
      end

      { imported: @imported_count, skipped: @skipped_count }
    end

    private

    def last_sync_date
      if bank_connection.last_synced_at.present?
        bank_connection.last_synced_at.to_date - 2.days # overlap for safety
      else
        90.days.ago.to_date
      end
    end

    def import_transaction(tx_data)
      transaction_id = tx_data["transactionId"] || tx_data["internalTransactionId"]
      return if transaction_id.blank?

      existing = BankTransaction.find_by(provider_transaction_id: transaction_id)
      if existing
        @skipped_count += 1
        return
      end

      BankTransaction.create!(
        bank_connection: bank_connection,
        provider_transaction_id: transaction_id,
        date: parse_date(tx_data["valueDate"] || tx_data["bookingDate"]),
        booking_date: parse_date(tx_data["bookingDate"]),
        amount: parse_amount(tx_data["transactionAmount"]),
        currency: tx_data.dig("transactionAmount", "currency") || "EUR",
        counterpart_name: extract_counterpart_name(tx_data),
        counterpart_iban: tx_data.dig("creditorAccount", "iban") || tx_data.dig("debtorAccount", "iban"),
        remittance_info: extract_remittance_info(tx_data),
        internal_reference: tx_data["entryReference"],
        status: "unmatched"
      )

      @imported_count += 1
    end

    def parse_date(date_str)
      return nil if date_str.blank?
      Date.parse(date_str)
    end

    def parse_amount(amount_data)
      return 0 if amount_data.blank?
      BigDecimal(amount_data["amount"].to_s)
    end

    def extract_counterpart_name(tx_data)
      tx_data["creditorName"] || tx_data["debtorName"] || tx_data.dig("creditorAccount", "iban")
    end

    def extract_remittance_info(tx_data)
      [
        tx_data["remittanceInformationUnstructured"],
        tx_data["remittanceInformationStructured"],
        tx_data.fetch("remittanceInformationUnstructuredArray", [])&.join(" ")
      ].compact_blank.join(" | ").presence
    end
  end
end
