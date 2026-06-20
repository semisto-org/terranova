# frozen_string_literal: true

module Design
  # Détail financier d'UN projet Design Studio, sur la VIE ENTIÈRE du projet (jamais
  # filtré par période) et en HTVA — cohérent avec DesignReportingService#grouped_project_rows.
  #
  # Renvoie un en-tête santé (CA / coûts split prestations-refacturés / marge / heures),
  # les lignes de recettes, les lignes de dépenses (direct + ventilées, chacune au montant
  # imputé au projet), et la répartition des heures billed / semos.
  #
  # Règles de coût (identiques au tableau de rentabilité) :
  #  - dépenses à lien direct SANS ventilation → montant HT complet sur ce projet ;
  #  - dépenses ventilées (ExpenseProjectAllocation) → seulement le montant alloué au projet,
  #    en HTVA (expense_project_allocations.amount), le projectable direct étant ignoré pour
  #    éviter le double comptage ;
  #  - split refacturé / prestations selon expenses.billable_to_client (une allocation hérite
  #    du flag de sa dépense parente).
  class ProjectReportingService
    def initialize(project)
      @project = project
    end

    def call
      revenue_lines = build_revenue_lines
      expense_lines = build_expense_lines
      timesheets = project.timesheets.where(deleted_at: nil)

      total_revenues = revenue_lines.sum { |line| line[:amount_excl_vat] }.round(2)
      rebilled = expense_lines.select { |line| line[:billable_to_client] }.sum { |line| line[:amount_excl_vat] }.round(2)
      non_rebilled = expense_lines.reject { |line| line[:billable_to_client] }.sum { |line| line[:amount_excl_vat] }.round(2)
      total_expenses = (rebilled + non_rebilled).round(2)
      gross_margin = (total_revenues - total_expenses).round(2)

      billed_hours = timesheets.where(mode: 'billed').sum(:hours).to_f
      semos_hours = timesheets.where(mode: 'semos').sum(:hours).to_f
      total_hours = timesheets.sum(:hours).to_f

      budget = project.expenses_budget.to_f

      {
        header: {
          project_id: project.id.to_s,
          name: project.name,
          status: project.status,
          client_name: project.client_name,
          revenues: total_revenues,
          expenses: total_expenses,
          rebilled_expenses: rebilled,
          non_rebilled_expenses: non_rebilled,
          gross_margin: gross_margin,
          gross_margin_pct: safe_ratio(gross_margin, total_revenues),
          total_hours: total_hours,
          billed_hours: billed_hours,
          semos_hours: semos_hours,
          expenses_budget: budget,
          over_budget: budget.positive? && total_expenses > budget,
          negative_margin: gross_margin.negative?
        },
        revenues: revenue_lines.sort_by { |line| line[:date].to_s }.reverse,
        expenses: expense_lines.sort_by { |line| line[:date].to_s }.reverse,
        hours: {
          billed: billed_hours,
          semos: semos_hours,
          total: total_hours,
          by_member: hours_by_member(timesheets)
        }
      }
    end

    private

    attr_reader :project

    def build_revenue_lines
      Revenue.where(deleted_at: nil, projectable_type: 'Design::Project', projectable_id: project.id)
        .includes(:contact)
        .map do |revenue|
          {
            id: revenue.id.to_s,
            date: revenue.date&.iso8601,
            label: revenue.label.presence || revenue.description.presence || revenue.category.presence || 'Recette',
            source: revenue.contact&.name.presence || revenue.revenue_type.presence,
            amount_excl_vat: revenue.amount_excl_vat.to_f,
            status: revenue.status
          }
        end
    end

    # Une dépense ventilée est imputée via ses allocations vers ce projet uniquement ; une
    # dépense à lien direct SANS ventilation est imputée pour son montant HT complet.
    def build_expense_lines
      lines = []

      direct = Expense.where(deleted_at: nil, projectable_type: 'Design::Project', projectable_id: project.id)
        .where.missing(:project_allocations)
      direct.each do |expense|
        lines << {
          id: expense.id.to_s,
          date: expense.invoice_date&.iso8601,
          label: expense.name.presence || expense.category.presence || 'Dépense',
          supplier: expense.supplier_display_name,
          amount_excl_vat: expense.amount_excl_vat.to_f,
          billable_to_client: !!expense.billable_to_client,
          source: 'direct'
        }
      end

      allocations = ExpenseProjectAllocation
        .where(projectable_type: 'Design::Project', projectable_id: project.id)
        .joins(:expense)
        .where(expenses: { deleted_at: nil })
        .includes(:expense)
      allocations.each do |allocation|
        expense = allocation.expense
        lines << {
          id: "#{expense.id}-#{allocation.id}",
          date: expense.invoice_date&.iso8601,
          label: expense.name.presence || expense.category.presence || 'Dépense',
          supplier: expense.supplier_display_name,
          amount_excl_vat: allocation.amount.to_f,
          billable_to_client: !!expense.billable_to_client,
          source: 'allocation',
          full_amount_excl_vat: expense.amount_excl_vat.to_f
        }
      end

      lines
    end

    def hours_by_member(timesheets)
      grouped = timesheets.group(:member_id, :member_name, :mode).sum(:hours)

      members = Hash.new do |hash, key|
        hash[key] = { member_id: key, member_name: nil, billed: 0.0, semos: 0.0 }
      end

      grouped.each do |(member_id, member_name, mode), hours|
        row = members[member_id.to_s]
        row[:member_name] ||= member_name.presence
        if mode == 'billed'
          row[:billed] += hours.to_f
        else
          row[:semos] += hours.to_f
        end
      end

      members.values.map do |row|
        row[:member_name] ||= row[:member_id]
        row[:billed] = row[:billed].round(2)
        row[:semos] = row[:semos].round(2)
        row[:total] = (row[:billed] + row[:semos]).round(2)
        row
      end.sort_by { |row| -row[:total] }
    end

    def safe_ratio(num, den)
      return 0.0 if den.to_f <= 0

      (num.to_f / den.to_f).round(4)
    end
  end
end
