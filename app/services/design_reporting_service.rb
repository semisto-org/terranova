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

    total_revenues = revenues.sum(:amount).to_f
    total_expenses = expenses.sum(:total_incl_vat).to_f
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

  def filtered_revenues
    scope = Revenue.where(deleted_at: nil)
      .yield_self { |s| parsed_from.present? ? s.where('date >= ?', parsed_from) : s }
      .yield_self { |s| parsed_to.present? ? s.where('date <= ?', parsed_to) : s }

    scope = if filters[:project_id].present?
      scope.where(design_project_id: filters[:project_id])
    else
      scope.where('design_project_id IS NOT NULL OR pole = ?', 'design_studio')
    end

    if filters[:client_id].present?
      scope = scope.joins('INNER JOIN design_projects ON design_projects.id = revenues.design_project_id')
        .where('design_projects.client_id = ?', filters[:client_id])
    end

    scope
  end

  def filtered_expenses
    scope = Expense.where(deleted_at: nil)
      .yield_self { |s| parsed_from.present? ? s.where('invoice_date >= ?', parsed_from) : s }
      .yield_self { |s| parsed_to.present? ? s.where('invoice_date <= ?', parsed_to) : s }

    scope = if filters[:project_id].present?
      scope.where(design_project_id: filters[:project_id])
    else
      scope.where('design_project_id IS NOT NULL OR poles @> ARRAY[?]::varchar[]', 'design')
    end

    if filters[:client_id].present?
      scope = scope.joins('INNER JOIN design_projects ON design_projects.id = expenses.design_project_id')
        .where('design_projects.client_id = ?', filters[:client_id])
    end

    scope
  end

  def filtered_timesheets
    scope = Timesheet.all
      .yield_self { |s| parsed_from.present? ? s.where('date >= ?', parsed_from) : s }
      .yield_self { |s| parsed_to.present? ? s.where('date <= ?', parsed_to) : s }

    scope = if filters[:project_id].present?
      scope.where(design_project_id: filters[:project_id])
    else
      scope.where.not(design_project_id: nil)
    end

    scope = scope.where(member_id: filters[:member_id]) if filters[:member_id].present?

    if filters[:client_id].present?
      scope = scope.joins('INNER JOIN design_projects ON design_projects.id = timesheets.design_project_id')
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
    revenue_map = filtered_revenues.group("DATE_TRUNC('month', date)").sum(:amount)
    expense_map = filtered_expenses.group("DATE_TRUNC('month', invoice_date)").sum(:total_incl_vat)
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
    revenue_map = filtered_revenues.where.not(design_project_id: nil).group(:design_project_id).sum(:amount)
    expense_map = filtered_expenses.where.not(design_project_id: nil).group(:design_project_id).sum(:total_incl_vat)
    hours_map = filtered_timesheets.where.not(design_project_id: nil).group(:design_project_id).sum(:hours)

    ids = (revenue_map.keys + expense_map.keys + hours_map.keys).uniq
    projects = Design::Project.where(id: ids).index_by(&:id)

    ids.map do |project_id|
      revenues = revenue_map[project_id].to_f
      expenses = expense_map[project_id].to_f
      hours = hours_map[project_id].to_f
      margin = revenues - expenses
      project = projects[project_id]

      {
        key: project_id.to_s,
        label: project&.name || "Projet ##{project_id}",
        client_id: project&.client_id,
        client_name: project&.client_name,
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

  def grouped_client_rows
    grouped_project_rows
      .group_by { |row| row[:client_id].presence || 'unassigned' }
      .map do |client_id, rows|
        revenues = rows.sum { |row| row[:revenues] }
        expenses = rows.sum { |row| row[:expenses] }
        hours = rows.sum { |row| row[:hours] }
        margin = revenues - expenses

        {
          key: client_id,
          label: rows.first[:client_name].presence || 'Client non défini',
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

  def grouped_member_rows
    rows = filtered_timesheets.group(:member_id, :member_name).sum(:hours)
    revenue_by_project = filtered_revenues.where.not(design_project_id: nil).group(:design_project_id).sum(:amount)
    expense_by_project = filtered_expenses.where.not(design_project_id: nil).group(:design_project_id).sum(:total_incl_vat)

    rows.map do |(member_id, member_name), hours_value|
      member_timesheets = filtered_timesheets.where(member_id: member_id)
      project_ids = member_timesheets.where.not(design_project_id: nil).distinct.pluck(:design_project_id)
      revenues = project_ids.sum { |id| revenue_by_project[id].to_f }
      expenses = project_ids.sum { |id| expense_by_project[id].to_f }
      hours = hours_value.to_f
      margin = revenues - expenses

      {
        key: member_id.to_s,
        label: member_name.presence || member_id.to_s,
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

  def data_quality(revenues, expenses, timesheets)
    {
      orphan_revenues_count: revenues.where(design_project_id: nil).count,
      orphan_expenses_count: expenses.where(design_project_id: nil).count,
      orphan_timesheets_count: timesheets.where(design_project_id: nil).count,
      fallback_revenues_count: revenues.where(design_project_id: nil, pole: 'design_studio').count,
      fallback_expenses_count: expenses.where(design_project_id: nil).where('poles @> ARRAY[?]::varchar[]', 'design').count
    }
  end

  def safe_ratio(num, den)
    return 0.0 if den.to_f <= 0

    (num.to_f / den.to_f).round(4)
  end
end
