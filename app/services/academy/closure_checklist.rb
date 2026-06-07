# frozen_string_literal: true

module Academy
  # Préparation à la clôture d'une activité (#48). Calcule, à partir de l'état
  # réel (pas d'une checklist stockée), ce qui bloque encore la clôture :
  #   - paiements participants non encaissés (registration.payment_status)
  #   - dépenses fournisseurs pas encore réglées (expense.status != "paid")
  #   - documents partagés (signal informatif, pas un bloqueur dur : une
  #     activité peut légitimement n'avoir aucun document)
  #
  # `readyToClose` est volontairement SOUPLE : il n'empêche pas la clôture côté
  # serveur (l'UI avertit seulement). Cf. QUESTIONS.md (#2).
  class ClosureChecklist
    def self.for(training)
      new(training).as_json
    end

    def initialize(training)
      @training = training
    end

    def as_json
      total = @training.registrations.count
      paid = @training.registrations.where(payment_status: "paid").count
      unpaid = total - paid
      pending_expenses = @training.expenses.where.not(status: "paid").count
      documents = @training.documents.count
      all_paid = unpaid.zero?

      {
        totalRegistrations: total,
        paidCount: paid,
        unpaidCount: unpaid,
        allPaid: all_paid,
        pendingExpensesCount: pending_expenses,
        documentsCount: documents,
        readyToClose: all_paid && pending_expenses.zero?
      }
    end
  end
end
