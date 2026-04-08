# frozen_string_literal: true

module Api
  module V1
    class BankController < BaseController
      before_action :require_admin
      before_action :set_connection, only: [:destroy_connection]
      before_action :set_transaction, only: [:ignore_transaction, :unignore_transaction]
      before_action :set_reconciliation, only: [:destroy_reconciliation]

      # POST /api/v1/bank/connect
      # Initiates GoCardless bank connection flow for a specific institution
      def connect
        institution_id = params.require(:institution_id)
        accounting_scope = params[:accounting_scope] || "general"

        unless BankSync::GocardlessClient::SUPPORTED_INSTITUTIONS.key?(institution_id)
          return render json: { error: "Institution non supportée: #{institution_id}" }, status: :unprocessable_entity
        end

        client = BankSync::GocardlessClient.new

        agreement = client.create_agreement(institution_id: institution_id)
        # Encode institution_id and scope in the reference for retrieval in callback
        reference = "#{institution_id}|#{accounting_scope}|#{SecureRandom.hex(8)}"
        requisition = client.create_requisition(
          institution_id: institution_id,
          redirect_url: params.require(:redirect_url),
          agreement_id: agreement["id"],
          reference: reference
        )

        render json: {
          requisitionId: requisition["id"],
          link: requisition["link"]
        }, status: :created
      rescue BankSync::GocardlessClient::ApiError => e
        render json: { error: e.message }, status: :bad_gateway
      end

      # POST /api/v1/bank/callback
      # Called after user completes bank auth; finalizes the connection
      def callback
        requisition_id = params.require(:requisition_id)
        client = BankSync::GocardlessClient.new

        requisition = client.get_requisition(requisition_id)

        unless requisition["status"] == "LN"
          return render json: { error: "Requisition not linked. Status: #{requisition['status']}" }, status: :unprocessable_entity
        end

        # Extract institution_id and scope from the reference
        reference = requisition["reference"] || ""
        parts = reference.split("|")
        institution_id = parts[0]
        accounting_scope = parts[1].presence || "general"
        bank_name = BankSync::GocardlessClient.institution_name(institution_id)

        account_ids = requisition["accounts"] || []
        connections = account_ids.map do |account_id|
          details = client.get_account_details(account_id)
          account_info = details["account"] || {}

          BankConnection.find_or_create_by!(provider_account_id: account_id) do |conn|
            conn.provider = "gocardless"
            conn.provider_requisition_id = requisition_id
            conn.institution_id = institution_id
            conn.bank_name = bank_name
            conn.iban = account_info["iban"]
            conn.status = "linked"
            conn.accounting_scope = accounting_scope
            conn.consent_expires_at = 90.days.from_now
            conn.connected_by = current_member
          end
        end

        render json: { connections: connections.map { |c| serialize_connection(c) } }, status: :created
      rescue BankSync::GocardlessClient::ApiError => e
        render json: { error: e.message }, status: :bad_gateway
      end

      # POST /api/v1/bank/connections
      # Create a manual bank connection (for CODA import)
      def create_connection
        connection = BankConnection.new(
          provider: "coda_import",
          bank_name: params.require(:bank_name),
          iban: params[:iban],
          status: "linked",
          accounting_scope: params[:accounting_scope] || "general",
          connected_by: current_member
        )

        if connection.save
          render json: serialize_connection(connection), status: :created
        else
          render json: { error: connection.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/bank/connections/:id/upload_coda
      # Upload a CODA file to import transactions
      def upload_coda
        connection = BankConnection.find(params.require(:id))
        file = params.require(:file)

        content = file.read
        importer = BankSync::CodaImporter.new(connection)
        result = importer.import(content)

        render json: {
          imported: result[:imported],
          skipped: result[:skipped],
          total: result[:movements_total],
          lastSyncedAt: connection.reload.last_synced_at&.iso8601
        }
      rescue BankSync::CodaParser::ParseError => e
        render json: { error: "Erreur de parsing CODA : #{e.message}" }, status: :unprocessable_entity
      end

      # GET /api/v1/bank/connections
      def list_connections
        connections = BankConnection.includes(:connected_by).order(created_at: :desc)
        render json: { items: connections.map { |c| serialize_connection(c) } }
      end

      # DELETE /api/v1/bank/connections/:id
      def destroy_connection
        if @connection.provider == "gocardless" && @connection.provider_requisition_id.present?
          begin
            client = BankSync::GocardlessClient.new
            client.delete_requisition(@connection.provider_requisition_id)
          rescue BankSync::GocardlessClient::ApiError
            # Continue even if remote deletion fails
          end
        end

        @connection.destroy!
        head :no_content
      end

      # POST /api/v1/bank/sync
      # Trigger manual sync for a connection
      def sync
        connection = BankConnection.find(params.require(:connection_id))

        if connection.consent_expired?
          connection.mark_expired!
          return render json: { error: "Le consentement bancaire a expiré. Veuillez reconnecter le compte." }, status: :unprocessable_entity
        end

        importer = BankSync::TransactionImporter.new(connection)
        result = importer.import(
          date_from: params[:date_from]&.to_date,
          date_to: params[:date_to]&.to_date
        )

        render json: {
          imported: result[:imported],
          skipped: result[:skipped],
          lastSyncedAt: connection.reload.last_synced_at&.iso8601
        }
      rescue BankSync::GocardlessClient::ApiError => e
        render json: { error: e.message }, status: :bad_gateway
      end

      # GET /api/v1/bank/transactions
      def list_transactions
        scope = BankTransaction.includes(:bank_connection, bank_reconciliation: :reconcilable)

        scope = scope.where(bank_connection_id: params[:connection_id]) if params[:connection_id].present?
        scope = scope.where(status: params[:status]) if params[:status].present?
        scope = scope.where("date >= ?", params[:date_from].to_date) if params[:date_from].present?
        scope = scope.where("date <= ?", params[:date_to].to_date) if params[:date_to].present?
        scope = scope.where("amount >= ?", params[:amount_min].to_f) if params[:amount_min].present?
        scope = scope.where("amount <= ?", params[:amount_max].to_f) if params[:amount_max].present?

        if params[:search].present?
          search = "%#{params[:search]}%"
          scope = scope.where("counterpart_name ILIKE ? OR remittance_info ILIKE ?", search, search)
        end

        transactions = scope.order(date: :desc, id: :desc)
          .page(params[:page] || 1)
          .per(params[:per_page] || 50)

        render json: {
          items: transactions.map { |t| serialize_transaction(t) },
          meta: {
            currentPage: transactions.respond_to?(:current_page) ? transactions.current_page : 1,
            totalPages: transactions.respond_to?(:total_pages) ? transactions.total_pages : 1,
            totalCount: transactions.respond_to?(:total_count) ? transactions.total_count : transactions.size
          }
        }
      rescue NoMethodError
        # Fallback if kaminari is not available — no pagination
        all_transactions = scope.order(date: :desc, id: :desc).limit(200)
        render json: {
          items: all_transactions.map { |t| serialize_transaction(t) },
          meta: { currentPage: 1, totalPages: 1, totalCount: all_transactions.size }
        }
      end

      # GET /api/v1/bank/transactions/:id/candidates
      # Find reconciliation candidates for a transaction
      def candidates
        transaction = BankTransaction.find(params.require(:id))
        reconciler = BankSync::Reconciler.new
        candidates = reconciler.find_candidates(transaction, limit: 10)

        render json: {
          items: candidates.map do |c|
            {
              type: c[:type].to_s.camelize,
              id: c[:record].id.to_s,
              score: c[:score],
              **serialize_candidate(c[:record], c[:type])
            }
          end
        }
      end

      # POST /api/v1/bank/reconciliations
      def create_reconciliation
        transaction = BankTransaction.find(params.require(:bank_transaction_id))
        reconcilable_type = params.require(:reconcilable_type)
        reconcilable_id = params.require(:reconcilable_id)

        unless BankReconciliation::RECONCILABLE_TYPES.include?(reconcilable_type)
          return render json: { error: "Type invalide: #{reconcilable_type}" }, status: :unprocessable_entity
        end

        reconcilable = reconcilable_type.constantize.find(reconcilable_id)

        reconciliation = BankReconciliation.new(
          bank_transaction: transaction,
          reconcilable: reconcilable,
          confidence: "manual",
          matched_by: current_member,
          notes: params[:notes]
        )

        if reconciliation.save
          render json: serialize_reconciliation(reconciliation), status: :created
        else
          render json: { error: reconciliation.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/bank/reconciliations/:id
      def destroy_reconciliation
        @reconciliation.destroy!
        head :no_content
      end

      # POST /api/v1/bank/reconciliations/auto
      def auto_reconcile
        connection = params[:connection_id].present? ? BankConnection.find(params[:connection_id]) : nil
        reconciler = BankSync::Reconciler.new
        result = reconciler.reconcile_all(bank_connection: connection)

        render json: {
          autoMatched: result[:auto_matched],
          suggested: result[:suggested]
        }
      end

      # PATCH /api/v1/bank/transactions/:id/ignore
      def ignore_transaction
        @transaction.mark_ignored!
        render json: serialize_transaction(@transaction)
      end

      # PATCH /api/v1/bank/transactions/:id/unignore
      def unignore_transaction
        @transaction.mark_unmatched!
        render json: serialize_transaction(@transaction)
      end

      # GET /api/v1/bank/summary
      def summary
        connections = BankConnection.active.includes(:connected_by)

        if connections.empty?
          return render json: {
            accounts: [],
            totals: { unmatchedCount: 0, matchedCount: 0 }
          }
        end

        total_unmatched = 0
        total_matched = 0

        accounts = connections.map do |conn|
          unmatched = BankTransaction.where(bank_connection: conn, status: "unmatched").count
          matched = BankTransaction.where(bank_connection: conn, status: "matched").count
          total_unmatched += unmatched
          total_matched += matched

          {
            connectionId: conn.id.to_s,
            bankName: conn.bank_name,
            iban: conn.iban,
            scope: conn.accounting_scope,
            balance: nil,
            unmatchedCount: unmatched,
            matchedCount: matched,
            lastSyncedAt: conn.last_synced_at&.iso8601,
            consentExpiresAt: conn.consent_expires_at&.iso8601,
            consentExpiringSoon: conn.consent_expiring_soon?
          }
        end

        render json: {
          accounts: accounts,
          totals: { unmatchedCount: total_unmatched, matchedCount: total_matched }
        }
      end

      private

      def require_admin
        unless current_member&.is_admin?
          render json: { error: "Accès non autorisé" }, status: :forbidden
        end
      end

      def set_connection
        @connection = BankConnection.find(params.require(:id))
      end

      def set_transaction
        @transaction = BankTransaction.find(params.require(:id))
      end

      def set_reconciliation
        @reconciliation = BankReconciliation.find(params.require(:id))
      end

      def serialize_connection(conn)
        {
          id: conn.id.to_s,
          provider: conn.provider,
          institutionId: conn.institution_id,
          bankName: conn.bank_name,
          iban: conn.iban,
          status: conn.status,
          accountingScope: conn.accounting_scope,
          consentExpiresAt: conn.consent_expires_at&.iso8601,
          consentExpiringSoon: conn.consent_expiring_soon?,
          lastSyncedAt: conn.last_synced_at&.iso8601,
          connectedBy: conn.connected_by ? { id: conn.connected_by.id.to_s, name: "#{conn.connected_by.first_name} #{conn.connected_by.last_name}" } : nil,
          createdAt: conn.created_at.iso8601
        }
      end

      def serialize_transaction(tx)
        rec = tx.bank_reconciliation
        conn = tx.bank_connection
        {
          id: tx.id.to_s,
          connectionId: conn.id.to_s,
          bankName: conn.bank_name,
          date: tx.date.iso8601,
          bookingDate: tx.booking_date&.iso8601,
          amount: tx.amount.to_f,
          currency: tx.currency,
          counterpartName: tx.counterpart_name,
          counterpartIban: tx.counterpart_iban,
          remittanceInfo: tx.remittance_info,
          internalReference: tx.internal_reference,
          category: tx.category,
          status: tx.status,
          reconciliation: rec ? {
            id: rec.id.to_s,
            type: rec.reconcilable_type,
            recordId: rec.reconcilable_id.to_s,
            confidence: rec.confidence,
            notes: rec.notes
          } : nil
        }
      end

      def serialize_candidate(record, type)
        if type == :expense
          {
            label: record.name,
            supplier: record.supplier_display_name,
            amount: record.total_incl_vat.to_f,
            date: record.invoice_date&.iso8601,
            status: record.status
          }
        else
          {
            label: record.label.presence || record.description.truncate(80),
            contact: record.contact&.name,
            amount: record.amount.to_f,
            date: record.date&.iso8601,
            status: record.status
          }
        end
      end

      def serialize_reconciliation(rec)
        {
          id: rec.id.to_s,
          bankTransactionId: rec.bank_transaction_id.to_s,
          reconcilableType: rec.reconcilable_type,
          reconcilableId: rec.reconcilable_id.to_s,
          confidence: rec.confidence,
          matchedBy: rec.matched_by ? { id: rec.matched_by.id.to_s, name: "#{rec.matched_by.first_name} #{rec.matched_by.last_name}" } : nil,
          notes: rec.notes,
          createdAt: rec.created_at.iso8601
        }
      end
    end
  end
end
