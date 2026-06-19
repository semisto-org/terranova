# frozen_string_literal: true

module BankSync
  # Imports transactions from a parsed CODA file into BankTransactions.
  # Handles deduplication via bank_reference as provider_transaction_id.
  class CodaImporter
    attr_reader :imported_count, :skipped_count

    def initialize(bank_connection)
      @bank_connection = bank_connection
      @imported_count = 0
      @skipped_count = 0
    end

    def import(coda_content)
      parser = CodaParser.new
      result = parser.parse(coda_content)

      ActiveRecord::Base.transaction do
        result.movements.each do |movement|
          import_movement(movement)
        end

        @bank_connection.update!(last_synced_at: Time.current)
      end

      { imported: @imported_count, skipped: @skipped_count, movements_total: result.movements.size }
    end

    private

    def import_movement(movement)
      # Build a unique transaction ID from the bank reference + value date
      transaction_id = build_transaction_id(movement)

      if BankTransaction.exists?(provider_transaction_id: transaction_id)
        @skipped_count += 1
        return
      end

      # Determine signed amount (positive = credit, negative = debit)
      amount = movement.sign == :credit ? movement.amount : -movement.amount

      BankTransaction.create!(
        bank_connection: @bank_connection,
        provider_transaction_id: transaction_id,
        date: movement.value_date || movement.booking_date || Date.current,
        booking_date: movement.booking_date,
        amount: amount,
        currency: "EUR",
        counterpart_name: movement.counterpart_name,
        counterpart_iban: movement.counterpart_account,
        remittance_info: movement.communication,
        internal_reference: movement.bank_reference,
        status: "unmatched"
      )

      @imported_count += 1
    end

    def build_transaction_id(movement)
      # Belgian banks (e.g. Triodos) often leave bank_reference blank, so it
      # cannot anchor uniqueness on its own. The CODA sequence number is the
      # bank-assigned, per-statement stable identifier — combined with the value
      # date and signed amount it uniquely identifies a movement and stays
      # idempotent when the same file is re-imported.
      date_str = (movement.value_date || movement.booking_date)&.iso8601 || "nodate"
      signed_amount = movement.sign == :credit ? movement.amount : -movement.amount
      ref = movement.bank_reference.presence || movement.sequence
      "coda_#{@bank_connection.id}_#{ref}_#{date_str}_#{signed_amount.to_s('F')}"
    end
  end
end
