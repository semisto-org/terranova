# frozen_string_literal: true

module BankSync
  # Imports transactions from a parsed CODA file into BankTransactions.
  #
  # Deduplication keys on a stable per-movement id (see #build_transaction_id).
  # The importer is also self-healing: a movement that was previously imported
  # under an older id scheme (e.g. blank-reference Triodos rows keyed only on the
  # date) is re-keyed in place rather than duplicated, so re-uploading a CODA
  # file repairs historical data while preserving reconciliations.
  class CodaImporter
    attr_reader :imported_count, :skipped_count, :remapped_count

    def initialize(bank_connection)
      @bank_connection = bank_connection
      @imported_count = 0
      @skipped_count = 0
      @remapped_count = 0
    end

    def import(coda_content)
      parser = CodaParser.new
      result = parser.parse(coda_content)

      ActiveRecord::Base.transaction do
        @existing_by_content = build_content_index
        @claimed = {}

        result.movements.each do |movement|
          import_movement(movement)
        end

        @bank_connection.update!(last_synced_at: Time.current)
      end

      {
        imported: @imported_count,
        skipped: @skipped_count,
        remapped: @remapped_count,
        movements_total: result.movements.size
      }
    end

    private

    def import_movement(movement)
      transaction_id = build_transaction_id(movement)

      if BankTransaction.exists?(provider_transaction_id: transaction_id)
        @skipped_count += 1
        return
      end

      amount = movement.sign == :credit ? movement.amount : -movement.amount

      # Self-heal: adopt a previously-imported row that matches this movement by
      # content but still carries an older dedup id. Updating (not recreating)
      # keeps its reconciliations attached.
      existing = claim_existing(movement, amount)
      if existing
        existing.update_column(:provider_transaction_id, transaction_id)
        @remapped_count += 1
        return
      end

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

    # Index this connection's existing CODA transactions by content so a movement
    # can find a prior import that used a different id scheme. Keyed on the same
    # fields the importer writes, so movement and row keys line up exactly.
    def build_content_index
      index = Hash.new { |hash, key| hash[key] = [] }
      @bank_connection.bank_transactions
        .where("provider_transaction_id LIKE ?", "coda_#{@bank_connection.id}_%")
        .find_each { |tx| index[content_key(tx.date, tx.amount, tx.remittance_info)] << tx }
      index
    end

    def claim_existing(movement, amount)
      date = movement.value_date || movement.booking_date
      bucket = @existing_by_content[content_key(date, amount, movement.communication)]
      tx = bucket.find { |candidate| !@claimed[candidate.id] }
      @claimed[tx.id] = true if tx
      tx
    end

    def content_key(date, amount, remittance)
      [date&.iso8601, amount.to_s, remittance.to_s.strip]
    end
  end
end
