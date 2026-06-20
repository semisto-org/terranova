# frozen_string_literal: true

class DesignReportingService
  GROUP_BY_VALUES = %w[month project client member].freeze

  def initialize(filters = {})
    @filters = filters.to_h.symbolize_keys
  end

  def call
    revenues = filtered_revenues
    expenses = filtered_expenses
    timesheets = filtered_timesheets

    # Reporting en HTVA : CA et dépenses hors taxe (la TVA transite, neutre pour un
    # assujetti). Revenus → amount_excl_vat ; dépenses → amount_excl_vat ; les
    # ventilations (expense_project_allocations.amount) sont déjà saisies en HTVA.
    total_revenues = revenues.sum(:amount_excl_vat).to_f
    total_expenses = expenses.sum(:amount_excl_vat).to_f
    total_hours = timesheets.sum(:hours).to_f
    gross_margin = total_revenues - total_expenses

    {
      period: { from: parsed_from&.iso8601, to: parsed_to&.iso8601 },
      filters: normalized_filters,
      kpis: {
        revenues: total_revenues,
        expenses: total_expenses,
        gross_margin: gross_margin,
        gross_margin_pct: safe_ratio(gross_margin, total_revenues),
        total_hours: total_hours,
        average_hourly_cost: safe_ratio(total_expenses, total_hours),
        average_hourly_revenue: safe_ratio(total_revenues, total_hours)
      },
      top_projects: project_profitability,
      timeseries: timeseries,
      grouped: grouped_breakdown,
      projects: grouped_project_rows,
      members: grouped_member_rows,
      alerts: alerts,
      filter_options: filter_options,
      data_quality: data_quality(revenues, expenses, timesheets)
    }
  end

  private

  attr_reader :filters

  def normalized_filters
    {
      from: parsed_from&.iso8601,
      to: parsed_to&.iso8601,
      project_id: filters[:project_id].presence,
      client_id: filters[:client_id].presence,
      member_id: filters[:member_id].presence,
      group_by: group_by
    }
  end

  def parsed_from
    @parsed_from ||= parse_date(filters[:from])
  end

  def parsed_to
    @parsed_to ||= parse_date(filters[:to])
  end

  def parse_date(value)
    return nil if value.blank?

    Date.parse(value.to_s)
  rescue ArgumentError
    nil
  end

  def group_by
    value = filters[:group_by].to_s
    GROUP_BY_VALUES.include?(value) ? value : 'month'
  end

  # `period: false` retire le filtre de période (mais garde projet/client) — utilisé par
  # le tableau de rentabilité par projet, qui se lit sur la vie entière du projet.
  def filtered_revenues(period: true)
    scope = Revenue.where(deleted_at: nil)
    if period
      scope = scope.where('date >= ?', parsed_from) if parsed_from.present?
      scope = scope.where('date <= ?', parsed_to) if parsed_to.present?
    end

    scope = if filters[:project_id].present?
      scope.where(projectable_type: 'Design::Project', projectable_id: filters[:project_id])
    else
      scope.where("projectable_type = 'Design::Project' OR pole = ?", 'design_studio')
    end

    if filters[:client_id].present?
      scope = scope.joins("INNER JOIN design_projects ON design_projects.id = revenues.projectable_id AND revenues.projectable_type = 'Design::Project'")
        .where('design_projects.client_id = ?', filters[:client_id])
    end

    exclude_internal_projects(scope)
  end

  def filtered_expenses(period: true)
    scope = Expense.where(deleted_at: nil)
    if period
      scope = scope.where('invoice_date >= ?', parsed_from) if parsed_from.present?
      scope = scope.where('invoice_date <= ?', parsed_to) if parsed_to.present?
    end

    scope = if filters[:project_id].present?
      scope.where(projectable_type: 'Design::Project', projectable_id: filters[:project_id])
    else
      # Colonnes qualifiées : expense_by_project_map joint expense_project_allocations
      # (qui possède aussi projectable_type) — sans préfixe, la référence est ambiguë.
      scope.where("expenses.projectable_type = 'Design::Project' OR expenses.poles @> ARRAY[?]::varchar[]", 'design')
    end

    if filters[:client_id].present?
      scope = scope.joins("INNER JOIN design_projects ON design_projects.id = expenses.projectable_id AND expenses.projectable_type = 'Design::Project'")
        .where('design_projects.client_id = ?', filters[:client_id])
    end

    exclude_internal_projects(scope)
  end

  # Exclut les projets internes (#159) du reporting : ils n'acceptent aucune
  # finance et ne doivent apparaître dans aucun groupement. No-op s'il n'y en a
  # pas (IN vide → 1=0 → la condition NOT(...) garde toutes les lignes).
  def exclude_internal_projects(scope)
    scope.where.not(projectable_type: "Design::Project", projectable_id: Design::Project.internal.select(:id))
  end

  # Coût imputé par projet, ventilé refacturé/non-refacturé. Source double :
  #  - dépenses à lien direct SANS ventilation (full total_incl_vat sur leur projectable) ;
  #  - ventilations (expense_project_allocations) — une dépense ventilée est imputée via
  #    ses allocations uniquement, son projectable direct est ignoré (pas de double comptage),
  #    et son reliquat non ventilé reste volontairement non imputé (travail interne).
  # Le split refacturé/non-refacturé suit `expenses.billable_to_client` : true = refacturé
  # au client, false = prestation (coût non refacturé). Une allocation hérite du flag de sa
  # dépense parente.
  # => { project_id => { rebilled: Float, non_rebilled: Float } }
  def expense_by_project_breakdown(period: true)
    (@expense_by_project_breakdown ||= {})[period] ||= begin
      result = Hash.new { |hash, key| hash[key] = { rebilled: 0.0, non_rebilled: 0.0 } }

      direct = filtered_expenses(period: period)
        .where(projectable_type: 'Design::Project')
        .where.missing(:project_allocations)
        .group('expenses.projectable_id', 'expenses.billable_to_client')
        .sum(:amount_excl_vat)
      direct.each do |(project_id, billable), amount|
        result[project_id][billable ? :rebilled : :non_rebilled] += amount.to_f
      end

      allocated = filtered_expense_allocations(period: period)
        .group('expense_project_allocations.projectable_id', 'expenses.billable_to_client')
        .sum(:amount)
      allocated.each do |(project_id, billable), amount|
        result[project_id][billable ? :rebilled : :non_rebilled] += amount.to_f
      end

      result
    end
  end

  # Coût total imputé par projet (refacturé + non-refacturé).
  def expense_by_project_map(period: true)
    (@expense_by_project_map ||= {})[period] ||= expense_by_project_breakdown(period: period).transform_values do |split|
      split[:rebilled] + split[:non_rebilled]
    end
  end

  # Ventilations de dépenses vers des projets Design, filtrées comme les dépenses
  # (période sur l'invoice_date de la dépense parente, projet, client).
  def filtered_expense_allocations(period: true)
    scope = ExpenseProjectAllocation
      .where(projectable_type: 'Design::Project')
      .joins(:expense)
      .where(expenses: { deleted_at: nil })

    if period
      scope = scope.where('expenses.invoice_date >= ?', parsed_from) if parsed_from.present?
      scope = scope.where('expenses.invoice_date <= ?', parsed_to) if parsed_to.present?
    end
    scope = scope.where(projectable_id: filters[:project_id]) if filters[:project_id].present?

    if filters[:client_id].present?
      scope = scope.joins('INNER JOIN design_projects ON design_projects.id = expense_project_allocations.projectable_id')
        .where('design_projects.client_id = ?', filters[:client_id])
    end

    scope
  end

  # Le Design Studio enregistre ses heures dans design_project_timesheets
  # (Design::ProjectTimesheet), pas dans la table polymorphe `timesheets`.
  def filtered_timesheets(period: true)
    scope = Design::ProjectTimesheet
    if period
      scope = scope.where('date >= ?', parsed_from) if parsed_from.present?
      scope = scope.where('date <= ?', parsed_to) if parsed_to.present?
    end

    scope = scope.where(project_id: filters[:project_id]) if filters[:project_id].present?
    scope = scope.where(member_id: filters[:member_id]) if filters[:member_id].present?

    if filters[:client_id].present?
      scope = scope.joins("INNER JOIN design_projects ON design_projects.id = design_project_timesheets.project_id")
        .where('design_projects.client_id = ?', filters[:client_id])
    end

    scope
  end

  def project_profitability
    rows = grouped_project_rows.sort_by { |item| item[:gross_margin] }
    {
      profitable: rows.reverse.first(5),
      unprofitable: rows.first(5)
    }
  end

  def timeseries
    revenue_map = filtered_revenues.group("DATE_TRUNC('month', date)").sum(:amount_excl_vat)
    expense_map = filtered_expenses.group("DATE_TRUNC('month', invoice_date)").sum(:amount_excl_vat)
    hours_map = filtered_timesheets.group("DATE_TRUNC('month', date)").sum(:hours)

    keys = (revenue_map.keys + expense_map.keys + hours_map.keys).compact.uniq.sort

    keys.map do |month|
      revenues = revenue_map[month].to_f
      expenses = expense_map[month].to_f
      hours = hours_map[month].to_f
      margin = revenues - expenses

      {
        period: month.to_date.iso8601,
        revenues: revenues,
        expenses: expenses,
        gross_margin: margin,
        gross_margin_pct: safe_ratio(margin, revenues),
        hours: hours,
        revenue_per_hour: safe_ratio(revenues, hours),
        cost_per_hour: safe_ratio(expenses, hours)
      }
    end
  end

  def grouped_breakdown
    case group_by
    when 'project' then grouped_project_rows
    when 'client' then grouped_client_rows
    when 'member' then grouped_member_rows
    else timeseries
    end
  end

  def grouped_project_rows
    @grouped_project_rows ||= build_grouped_project_rows
  end

  # Rentabilité par projet : lue sur la VIE ENTIÈRE du projet (period: false) — le filtre
  # de période piloterait une marge incohérente (CA et coûts de fenêtres différentes). La
  # période continue de piloter les KPIs et la timeseries.
  def build_grouped_project_rows
    revenue_map = filtered_revenues(period: false).where(projectable_type: 'Design::Project').group(:projectable_id).sum(:amount_excl_vat)
    expense_map = expense_by_project_map(period: false)
    hours_map = filtered_timesheets(period: false).group(:project_id).sum(:hours)

    ids = (revenue_map.keys + expense_map.keys + hours_map.keys).uniq
    projects = Design::Project.where(id: ids).index_by(&:id)

    ids.map do |project_id|
      revenues = revenue_map[project_id].to_f
      split = expense_by_project_breakdown(period: false)[project_id]
      rebilled_expenses = split[:rebilled]
      non_rebilled_expenses = split[:non_rebilled]
      expenses = expense_map[project_id].to_f
      hours = hours_map[project_id].to_f
      margin = revenues - expenses
      project = projects[project_id]

      {
        key: project_id.to_s,
        label: project&.name || "Projet ##{project_id}",
        status: project&.status,
        client_id: project&.client_id,
        client_name: project&.client_name,
        revenues: revenues,
        expenses: expenses,
        rebilled_expenses: rebilled_expenses,
        non_rebilled_expenses: non_rebilled_expenses,
        gross_margin: margin,
        gross_margin_pct: safe_ratio(margin, revenues),
        hours: hours,
        revenue_per_hour: safe_ratio(revenues, hours),
        cost_per_hour: safe_ratio(expenses, hours)
      }
    end
  end

  def grouped_client_rows
    grouped_project_rows
      .group_by { |row| row[:client_id].presence || 'unassigned' }
      .map do |client_id, rows|
        revenues = rows.sum { |row| row[:revenues] }
        expenses = rows.sum { |row| row[:expenses] }
        rebilled_expenses = rows.sum { |row| row[:rebilled_expenses].to_f }
        non_rebilled_expenses = rows.sum { |row| row[:non_rebilled_expenses].to_f }
        hours = rows.sum { |row| row[:hours] }
        margin = revenues - expenses

        {
          key: client_id,
          label: rows.first[:client_name].presence || 'Client non défini',
          revenues: revenues,
          expenses: expenses,
          rebilled_expenses: rebilled_expenses,
          non_rebilled_expenses: non_rebilled_expenses,
          gross_margin: margin,
          gross_margin_pct: safe_ratio(margin, revenues),
          hours: hours,
          revenue_per_hour: safe_ratio(revenues, hours),
          cost_per_hour: safe_ratio(expenses, hours)
        }
      end
  end

  def grouped_member_rows
    @grouped_member_rows ||= build_grouped_member_rows
  end

  def build_grouped_member_rows
    rows = filtered_timesheets.group(:member_id, :member_name).sum(:hours)
    revenue_by_project = filtered_revenues.where(projectable_type: 'Design::Project').group(:projectable_id).sum(:amount_excl_vat)
    expense_by_project = expense_by_project_map
    # Heures rémunérées (billed) vs non-rémunérées (semos) par designer — délibération #20.
    hours_by_mode = filtered_timesheets.group(:member_id, :mode).sum(:hours)

    rows.map do |(member_id, member_name), hours_value|
      member_timesheets = filtered_timesheets.where(member_id: member_id)
      project_ids = member_timesheets.distinct.pluck(:project_id)
      revenues = project_ids.sum { |id| revenue_by_project[id].to_f }
      expenses = project_ids.sum { |id| expense_by_project[id].to_f }
      rebilled_expenses = project_ids.sum { |id| expense_by_project_breakdown[id][:rebilled] }
      non_rebilled_expenses = project_ids.sum { |id| expense_by_project_breakdown[id][:non_rebilled] }
      hours = hours_value.to_f
      paid_hours = hours_by_mode[[member_id, 'billed']].to_f
      unpaid_hours = hours_by_mode[[member_id, 'semos']].to_f
      margin = revenues - expenses

      {
        key: member_id.to_s,
        label: member_name.presence || member_id.to_s,
        revenues: revenues,
        expenses: expenses,
        rebilled_expenses: rebilled_expenses,
        non_rebilled_expenses: non_rebilled_expenses,
        gross_margin: margin,
        gross_margin_pct: safe_ratio(margin, revenues),
        hours: hours,
        paid_hours: paid_hours,
        unpaid_hours: unpaid_hours,
        paid_share: safe_ratio(paid_hours, paid_hours + unpaid_hours),
        revenue_per_hour: safe_ratio(revenues, hours),
        cost_per_hour: safe_ratio(expenses, hours)
      }
    end
  end

  def alerts
    rows = grouped_project_rows
    budgets = Design::Project.where(id: rows.map { |row| row[:key] }).pluck(:id, :expenses_budget).to_h
    rows.flat_map do |row|
      project_alerts = []
      if row[:gross_margin].negative?
        project_alerts << { level: 'high', kind: 'negative_margin', projectId: row[:key], message: "Marge négative sur #{row[:label]}" }
      end
      budget = budgets[row[:key].to_i].to_f
      if budget.positive? && row[:expenses] > budget
        project_alerts << { level: 'medium', kind: 'cost_overrun', projectId: row[:key], message: "Dépassement de coûts sur #{row[:label]}" }
      end
      project_alerts
    end.first(12)
  end

  def filter_options
    {
      projects: Design::Project.where(deleted_at: nil).order(:name).pluck(:id, :name).map { |id, name| { id: id.to_s, name: name } },
      clients: Design::Project.where(deleted_at: nil).where.not(client_id: nil).order(:client_name).distinct.pluck(:client_id, :client_name)
        .map { |id, name| { id: id.to_s, name: name } }.uniq { |client| client[:id] },
      members: Design::ProjectTimesheet.where.not(member_id: nil).order(:member_name).distinct.pluck(:member_id, :member_name)
        .map { |id, name| { id: id.to_s, name: name.presence || id.to_s } }
    }
  end

  def data_quality(revenues, expenses, timesheets)
    {
      orphan_revenues_count: revenues.where.not(projectable_type: 'Design::Project').count,
      orphan_expenses_count: expenses.where.not(projectable_type: 'Design::Project').count,
      orphan_timesheets_count: 0, # heures sourcées de design_project_timesheets — jamais orphelines

      fallback_revenues_count: revenues.where.not(projectable_type: 'Design::Project').where(pole: 'design_studio').count,
      fallback_expenses_count: expenses.where.not(projectable_type: 'Design::Project').where('poles @> ARRAY[?]::varchar[]', 'design').count
    }
  end

  def safe_ratio(num, den)
    return 0.0 if den.to_f <= 0

    (num.to_f / den.to_f).round(4)
  end
end
