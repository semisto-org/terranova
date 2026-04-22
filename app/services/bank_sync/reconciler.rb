# frozen_string_literal: true

module BankSync
  class Reconciler
    AMOUNT_TOLERANCE = 0.01
    DATE_TOLERANCE_DAYS = 5

    attr_reader :auto_matched, :suggested

    def initialize
      @auto_matched = 0
      @suggested = 0
    end

    # Run automatic reconciliation on unmatched transactions
    def reconcile_all(bank_connection: nil)
      scope = BankTransaction.unmatched
      scope = scope.where(bank_connection: bank_connection) if bank_connection

      scope.find_each do |transaction|
        match = find_best_match(transaction)
        next unless match

        create_reconciliation(transaction, match[:record], match[:confidence])
      end

      { auto_matched: @auto_matched, suggested: @suggested }
    end

    # Find match candidates for a single transaction (for UI suggestions)
    def find_candidates(transaction, limit: 10)
      if transaction.debit?
        find_expense_candidates(transaction, limit: limit)
      else
        find_revenue_candidates(transaction, limit: limit)
      end
    end

    private

    def find_best_match(transaction)
      candidates = find_candidates(transaction, limit: 5)
      return nil if candidates.empty?

      best = candidates.first
      return nil if best[:score] < 50

      confidence = best[:score] >= 80 ? "auto" : "suggested"
      { record: best[:record], confidence: confidence }
    end

    def find_expense_candidates(transaction, limit:)
      abs_amount = transaction.amount.abs
      date = transaction.date

      expenses = Expense
        .left_joins(:bank_reconciliations)
        .where(bank_reconciliations: { id: nil })
        .where(expenses: { status: %w[ready_for_payment paid] })
        .where("expenses.total_incl_vat BETWEEN ? AND ?", abs_amount - AMOUNT_TOLERANCE, abs_amount + AMOUNT_TOLERANCE)
        .where(expenses: { invoice_date: (date - DATE_TOLERANCE_DAYS.days)..(date + DATE_TOLERANCE_DAYS.days) })

      # Scope-aware filtering: restrict to matching poles when connection has a scope
      scope_poles = transaction.bank_connection.scope_poles
      if scope_poles
        expenses = expenses.where("poles && ARRAY[?]::varchar[]", scope_poles)
      end

      expenses = expenses.limit(limit * 2)
      score_and_sort(expenses, transaction, :expense).first(limit)
    end

    def find_revenue_candidates(transaction, limit:)
      amount = transaction.amount
      date = transaction.date

      revenues = Revenue
        .left_joins(:bank_reconciliations)
        .where(bank_reconciliations: { id: nil })
        .where(revenues: { status: %w[confirmed received] })
        .where("revenues.amount BETWEEN ? AND ?", amount - AMOUNT_TOLERANCE, amount + AMOUNT_TOLERANCE)
        .where(revenues: { date: (date - DATE_TOLERANCE_DAYS.days)..(date + DATE_TOLERANCE_DAYS.days) })

      # Scope-aware filtering: restrict to matching poles when connection has a scope
      scope_poles = transaction.bank_connection.scope_poles
      if scope_poles
        revenues = revenues.where(pole: scope_poles)
      end

      revenues = revenues.limit(limit * 2)
      score_and_sort(revenues, transaction, :revenue).first(limit)
    end

    def score_and_sort(records, transaction, type)
      records.map do |record|
        score = calculate_score(record, transaction, type)
        { record: record, score: score, type: type }
      end.sort_by { |c| -c[:score] }
    end

    def calculate_score(record, transaction, type)
      score = 0

      # Amount match (0-40 points)
      record_amount = type == :expense ? record.total_incl_vat : record.amount
      tx_amount = transaction.amount.abs
      amount_diff = (record_amount - tx_amount).abs

      if amount_diff < AMOUNT_TOLERANCE
        score += 40
      elsif amount_diff < 1.0
        score += 30
      end

      # Date proximity (0-30 points)
      record_date = type == :expense ? record.invoice_date : record.date
      if record_date.present?
        day_diff = (transaction.date - record_date).abs
        if day_diff == 0
          score += 30
        elsif day_diff <= 1
          score += 25
        elsif day_diff <= 3
          score += 15
        elsif day_diff <= DATE_TOLERANCE_DAYS
          score += 5
        end
      end

      # Counterpart IBAN match (0-40 points) — strongest signal, learned from prior reconciliations
      if type == :expense && transaction.counterpart_iban.present?
        supplier_iban = record.supplier_contact&.iban
        if supplier_iban.present?
          tx_iban = transaction.counterpart_iban.to_s.gsub(/\s+/, "").upcase
          normalized_supplier = supplier_iban.to_s.gsub(/\s+/, "").upcase
          score += 40 if tx_iban == normalized_supplier
        end
      end

      # Counterpart name match (0-30 points)
      if transaction.counterpart_name.present?
        name_to_match = if type == :expense
          record.supplier_display_name
        else
          record.contact&.name
        end

        if name_to_match.present?
          tx_name = transaction.counterpart_name.downcase.strip
          record_name = name_to_match.downcase.strip

          if tx_name == record_name
            score += 30
          elsif tx_name.include?(record_name) || record_name.include?(tx_name)
            score += 20
          end
        end
      end

      # Stripe payment_intent match (+50 points) — strongest signal when Stripe
      # imports a charge and the webhook has already created the matching Revenue.
      if type == :revenue &&
          transaction.internal_reference.present? &&
          record.respond_to?(:stripe_payment_intent_id) &&
          record.stripe_payment_intent_id.present? &&
          transaction.internal_reference == record.stripe_payment_intent_id
        score += 50
      end

      score
    end

    def create_reconciliation(transaction, record, confidence)
      BankReconciliation.create!(
        bank_transaction: transaction,
        reconcilable: record,
        confidence: confidence,
        amount: transaction.amount.abs
      )

      if confidence == "auto"
        @auto_matched += 1
      else
        @suggested += 1
      end
    rescue ActiveRecord::RecordInvalid
      # Transaction was already matched (race condition), skip
    end
  end
end
