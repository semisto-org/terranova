# frozen_string_literal: true

class BankSyncJob < ApplicationJob
  queue_as :default

  def perform
    BankConnection.active.find_each do |connection|
      if connection.consent_expired?
        connection.mark_expired!
        Rails.logger.warn "[BankSync] Connection #{connection.id} (#{connection.iban}) consent expired"
        next
      end

      importer = BankSync::TransactionImporter.new(connection)
      result = importer.import

      Rails.logger.info "[BankSync] Connection #{connection.id}: imported #{result[:imported]}, skipped #{result[:skipped]}"

      # Auto-reconcile newly imported transactions
      if result[:imported] > 0
        reconciler = BankSync::Reconciler.new
        rec_result = reconciler.reconcile_all(bank_connection: connection)
        Rails.logger.info "[BankSync] Reconciliation: #{rec_result[:auto_matched]} auto-matched, #{rec_result[:suggested]} suggested"
      end
    rescue BankSync::GocardlessClient::ApiError => e
      Rails.logger.error "[BankSync] Failed to sync connection #{connection.id}: #{e.message}"
    end
  end
end
