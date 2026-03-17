# frozen_string_literal: true

module Academy
  class DashboardService
    ACTIVE_STATUSES = %w[idea in_construction in_preparation registrations_open in_progress post_production].freeze

    def call
      {
        upcomingSessions: upcoming_sessions,
        recentRegistrations: recent_registrations,
        paymentAlerts: payment_alerts,
        trainingReadiness: training_readiness,
        expenseUpdates: expense_updates,
        quickStats: quick_stats
      }
    end

    private

    def upcoming_sessions
      sessions = Academy::TrainingSession
        .joins(:training)
        .includes(training: [:training_type, :registrations, :documents])
        .where("academy_training_sessions.start_date >= ? AND academy_training_sessions.start_date <= ?", Date.today, 60.days.from_now)
        .where(academy_trainings: { deleted_at: nil })
        .where(academy_training_sessions: { deleted_at: nil })
        .order("academy_training_sessions.start_date ASC")

      members_by_id = Member.all.index_by { |m| m.id.to_s }
      locations_by_id = Academy::TrainingLocation.all.index_by { |l| l.id.to_s }

      sessions.map do |session|
        training = session.training
        reg_count = training.registrations.count { |r| r.deleted_at.nil? }
        max = training.max_participants.to_i
        checklist_items = training.checklist_items || []
        checked_items = training.checked_items || []

        {
          sessionId: session.id.to_s,
          trainingId: training.id.to_s,
          trainingTitle: training.title,
          trainingTypeName: training.training_type&.name,
          startDate: session.start_date.iso8601,
          endDate: session.end_date.iso8601,
          locationNames: (session.location_ids || []).filter_map { |id| locations_by_id[id.to_s]&.name },
          trainerNames: (session.trainer_ids || []).filter_map { |id| resolve_person_name(id, members_by_id) },
          registrationCount: reg_count,
          maxParticipants: max,
          fillRate: max > 0 ? (reg_count.to_f / max * 100).round : 0,
          readinessChecks: {
            hasLocation: (session.location_ids || []).any?,
            hasTrainer: (session.trainer_ids || []).any?,
            hasPrice: training.price.to_f > 0,
            checklistProgress: [checked_items.size, checklist_items.size]
          }
        }
      end
    end

    def recent_registrations
      registrations = Academy::TrainingRegistration
        .joins(:training)
        .includes(:training, :contact)
        .where(academy_training_registrations: { deleted_at: nil })
        .where(academy_trainings: { deleted_at: nil })
        .order(registered_at: :desc)
        .limit(15)

      registrations.map do |reg|
        {
          registrationId: reg.id.to_s,
          contactName: reg.contact_name,
          contactEmail: reg.contact_email,
          trainingTitle: reg.training.title,
          trainingId: reg.training_id.to_s,
          registeredAt: reg.registered_at.iso8601,
          paymentStatus: reg.payment_status,
          amountPaid: reg.amount_paid.to_f,
          trainingPrice: reg.training.price.to_f
        }
      end
    end

    def payment_alerts
      registrations = Academy::TrainingRegistration
        .joins(:training)
        .includes(:training, :contact)
        .where.not(payment_status: "paid")
        .where(academy_trainings: { status: ACTIVE_STATUSES })
        .where(academy_training_registrations: { deleted_at: nil })
        .where(academy_trainings: { deleted_at: nil })
        .order(:registered_at)

      registrations.map do |reg|
        {
          registrationId: reg.id.to_s,
          contactName: reg.contact_name,
          trainingTitle: reg.training.title,
          trainingId: reg.training_id.to_s,
          registeredAt: reg.registered_at.iso8601,
          daysSinceRegistration: (Date.today - reg.registered_at.to_date).to_i,
          paymentStatus: reg.payment_status,
          amountPaid: reg.amount_paid.to_f,
          expectedAmount: reg.training.price.to_f
        }
      end
    end

    def training_readiness
      trainings = Academy::Training
        .includes(:training_type, :sessions, :registrations, :documents)
        .where(status: ACTIVE_STATUSES)
        .where(deleted_at: nil)

      trainings.map do |training|
        active_sessions = training.sessions.select { |s| s.deleted_at.nil? }
        active_registrations = training.registrations.select { |r| r.deleted_at.nil? }
        active_documents = training.documents.select { |d| d.deleted_at.nil? }
        checklist_items = training.checklist_items || []
        checked_items = training.checked_items || []
        next_session = active_sessions.select { |s| s.start_date >= Date.today }.min_by(&:start_date)
        max = training.max_participants.to_i

        {
          trainingId: training.id.to_s,
          title: training.title,
          trainingTypeName: training.training_type&.name,
          status: training.status,
          checks: {
            hasLocation: active_sessions.any? { |s| (s.location_ids || []).any? },
            hasTrainer: active_sessions.any? { |s| (s.trainer_ids || []).any? },
            hasPrice: training.price.to_f > 0,
            hasSessions: active_sessions.any?,
            checklistComplete: checklist_items.any? && checked_items.size >= checklist_items.size,
            checklistProgress: [checked_items.size, checklist_items.size],
            documentsCount: active_documents.size
          },
          nextSessionDate: next_session&.start_date&.iso8601,
          registrationCount: active_registrations.size,
          maxParticipants: max
        }
      end.sort_by { |t| [t[:nextSessionDate] ? 0 : 1, t[:nextSessionDate] || "9999-12-31"] }
    end

    def expense_updates
      expenses = Expense
        .where.not(training_id: nil)
        .where("expenses.updated_at >= ?", 14.days.ago)
        .where(deleted_at: nil)
        .joins("INNER JOIN academy_trainings ON academy_trainings.id = expenses.training_id")
        .includes(:training)
        .order(updated_at: :desc)
        .limit(10)

      expenses.map do |expense|
        {
          expenseId: expense.id.to_s,
          trainingTitle: expense.training&.title,
          trainingId: expense.training_id.to_s,
          supplier: expense.supplier_display_name,
          category: expense.category,
          status: expense.status,
          totalInclVat: expense.total_incl_vat.to_f,
          updatedAt: expense.updated_at.iso8601
        }
      end
    end

    def quick_stats
      active_trainings = Academy::Training.where(status: ACTIVE_STATUSES, deleted_at: nil)
      active_training_ids = active_trainings.pluck(:id)

      upcoming_count = Academy::TrainingSession
        .where(training_id: active_training_ids, deleted_at: nil)
        .where("start_date >= ? AND start_date <= ?", Date.today, 60.days.from_now)
        .count

      month_start = Date.today.beginning_of_month
      month_end = Date.today.end_of_month
      registrations_this_month = Academy::TrainingRegistration
        .where(training_id: active_training_ids, deleted_at: nil)
        .where(registered_at: month_start.beginning_of_day..month_end.end_of_day)
        .count

      pending_payments = Academy::TrainingRegistration
        .where(training_id: active_training_ids, deleted_at: nil)
        .where.not(payment_status: "paid")

      pending_count = pending_payments.count
      pending_total = pending_payments.joins(:training).sum("academy_trainings.price").to_f

      unpaid_expenses = Expense
        .where(training_id: active_training_ids, deleted_at: nil)
        .where.not(status: "paid")

      unpaid_count = unpaid_expenses.count
      unpaid_total = unpaid_expenses.sum(:total_incl_vat).to_f

      fill_rates = active_trainings.includes(:registrations).filter_map do |t|
        next if t.max_participants.to_i.zero?
        active_regs = t.registrations.count { |r| r.deleted_at.nil? }
        (active_regs.to_f / t.max_participants * 100).round
      end
      avg_fill = fill_rates.any? ? (fill_rates.sum.to_f / fill_rates.size).round : 0

      {
        activeTrainingsCount: active_trainings.count,
        upcomingSessionsCount: upcoming_count,
        totalRegistrationsThisMonth: registrations_this_month,
        pendingPaymentsCount: pending_count,
        pendingPaymentsTotal: pending_total,
        unpaidExpensesCount: unpaid_count,
        unpaidExpensesTotal: unpaid_total,
        averageFillRate: avg_fill
      }
    end

    def resolve_person_name(id, members_by_id)
      member = members_by_id[id.to_s]
      return "#{member.first_name} #{member.last_name}" if member

      contact = Contact.find_by(id: id, deleted_at: nil)
      contact&.name
    end
  end
end
