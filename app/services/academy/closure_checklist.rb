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
  #
  # Pour éviter un N+1 quand on sérialise toutes les activités (index public),
  # les comptes peuvent être pré-calculés en masse et injectés via `counts:`
  # (cf. AcademyController#closure_counts_for). Sans `counts`, le service
  # interroge la base lui-même (usage mono-activité).
  class ClosureChecklist
    def self.for(training, counts: nil)
      new(training, counts: counts).as_json
    end

    def initialize(training, counts: nil)
      @training = training
      @counts = counts
    end

    def as_json
      total = @counts ? @counts[:total] : @training.registrations.count
      paid = @counts ? @counts[:paid] : @training.registrations.where(payment_status: "paid").count
      pending_expenses = @counts ? @counts[:pending_expenses] : @training.expenses.where.not(status: "paid").count
      documents = @counts ? @counts[:documents] : @training.documents.count
      unpaid = total - paid
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
