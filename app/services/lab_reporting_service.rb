# frozen_string_literal: true

class LabReportingService
  DEFAULT_MONTHS = 12
  SPIKE_THRESHOLD_DEFAULT = 0.30

  def initialize(filters = {})
    @filters = filters.to_h.symbolize_keys
  end

  def call
    revenues = filtered_revenues
    expenses = filtered_expenses

    total_revenues = revenues.sum(:amount).to_f
    total_expenses = expenses.sum(:total_incl_vat).to_f
    net_balance = total_revenues - total_expenses

    monthly_series = monthly_timeseries(revenues, expenses)
    burn_rate = average_burn_rate(monthly_series)
    runway_months = estimated_runway_months(net_balance, burn_rate)

    {
      period: { from: period_from.iso8601, to: period_to.iso8601 },
      filters: normalized_filters,
      kpis: {
        revenues: total_revenues,
        expenses: total_expenses,
        netBalance: net_balance,
        monthlyBurnRate: burn_rate,
        estimatedRunwayMonths: runway_months
      },
      topCostItems: top_cost_items(expenses),
      timeseries: monthly_series,
      breakdowns: {
        byPole: breakdown_by_pole(revenues, expenses),
        byCategory: breakdown_by_category(revenues, expenses)
      },
      alerts: alerts(monthly_series, expenses)
    }
  end

  private

  attr_reader :filters

  def normalized_filters
    {
      from: period_from.iso8601,
      to: period_to.iso8601,
      pole: filters[:pole].presence,
      category: filters[:category].presence,
      supplier: filters[:supplier].presence
    }
  end

  def period_from
    @period_from ||= begin
      parsed = parse_date(filters[:from])
      parsed || (period_to << (DEFAULT_MONTHS - 1)).beginning_of_month
    end
  end

  def period_to
    @period_to ||= begin
      parsed = parse_date(filters[:to])
      (parsed || Date.current).end_of_month
    end
  end

  def parse_date(value)
    return nil if value.blank?

    Date.parse(value.to_s)
  rescue ArgumentError
    nil
  end

  def filtered_revenues
    scope = Revenue.where(date: period_from..period_to)
    scope = scope.where(pole: mapped_revenue_pole) if mapped_revenue_pole.present?
    scope = scope.where(category: filters[:category]) if filters[:category].present?
    scope
  end

  def filtered_expenses
    scope = Expense.where(invoice_date: period_from..period_to)

    if mapped_expense_pole.present?
      scope = scope.where("? = ANY(poles)", mapped_expense_pole)
    end

    scope = scope.where(category: filters[:category]) if filters[:category].present?

    if filters[:supplier].present?
      q = "%#{filters[:supplier].strip}%"
      scope = scope.where("supplier ILIKE ?", q)
    end

    scope
  end

  def mapped_revenue_pole
    @mapped_revenue_pole ||= begin
      case filters[:pole].to_s
      when 'lab' then nil
      when 'design' then 'design_studio'
      when 'roots' then 'roots'
      when 'academy' then 'academy'
      when 'nursery' then 'nursery'
      else
        filters[:pole].presence
      end
    end
  end

  def mapped_expense_pole
    @mapped_expense_pole ||= begin
      value = filters[:pole].to_s
      value == 'design_studio' ? 'design' : value.presence
    end
  end

  def month_keys
    from = period_from.beginning_of_month
    to = period_to.beginning_of_month

    keys = []
    current = from
    while current <= to
      keys << current
      current = current.next_month
    end
    keys
  end

  def monthly_timeseries(revenues, expenses)
    revenues_by_month = revenues.group("TO_CHAR(date, 'YYYY-MM')").sum(:amount)
    expenses_by_month = expenses.group("TO_CHAR(invoice_date, 'YYYY-MM')").sum(:total_incl_vat)

    month_keys.map do |month|
      key = month.strftime('%Y-%m')
      rev = revenues_by_month[key].to_f
      exp = expenses_by_month[key].to_f
      {
        month: key,
        revenues: rev,
        expenses: exp,
        netBalance: rev - exp
      }
    end
  end

  def average_burn_rate(monthly_series)
    months_with_spend = monthly_series.select { |m| m[:expenses].positive? }
    source = months_with_spend.last(3)
    return 0.0 if source.empty?

    (source.sum { |m| m[:expenses] } / source.size.to_f).round(2)
  end

  def estimated_runway_months(net_balance, burn_rate)
    return nil if burn_rate <= 0
    return nil if net_balance <= 0

    (net_balance / burn_rate).round(1)
  end

  def top_cost_items(expenses)
    expenses.group(:category).sum(:total_incl_vat)
      .sort_by { |_category, amount| -amount.to_f }
      .first(5)
      .map do |category, amount|
        {
          label: category.presence || 'Non catégorisé',
          amount: amount.to_f
        }
      end
  end

  def breakdown_by_pole(revenues, expenses)
    revenue_rows = revenues.group(:pole).sum(:amount)
    expense_rows = expenses.group(:poles).sum(:total_incl_vat)

    poles = (revenue_rows.keys + expense_rows.keys.flat_map { |arr| Array(arr) }).compact.uniq

    poles.map do |pole|
      rev = revenue_rows[pole].to_f
      exp = expense_rows.sum { |k, v| Array(k).include?(pole) ? v.to_f : 0.0 }
      {
        pole: pole,
        revenues: rev,
        expenses: exp,
        netBalance: rev - exp
      }
    end.sort_by { |row| row[:pole].to_s }
  end

  def breakdown_by_category(revenues, expenses)
    rev_rows = revenues.group(:category).sum(:amount)
    exp_rows = expenses.group(:category).sum(:total_incl_vat)

    categories = (rev_rows.keys + exp_rows.keys).compact.uniq

    categories.map do |category|
      rev = rev_rows[category].to_f
      exp = exp_rows[category].to_f
      {
        category: category.presence || 'Non catégorisé',
        revenues: rev,
        expenses: exp,
        netBalance: rev - exp
      }
    end.sort_by { |row| -row[:expenses] }
  end

  def alerts(monthly_series, expenses)
    deficit_months = monthly_series.select { |m| m[:netBalance].negative? }.map { |m| m[:month] }

    threshold = (filters[:spike_threshold].presence || SPIKE_THRESHOLD_DEFAULT).to_f
    spikes = monthly_series.each_cons(2).filter_map do |prev, curr|
      next if prev[:expenses] <= 0
      growth = (curr[:expenses] - prev[:expenses]) / prev[:expenses]
      next unless growth > threshold

      {
        month: curr[:month],
        growthRate: growth.round(3)
      }
    end

    total_expenses = expenses.sum(:total_incl_vat).to_f
    critical_posts = top_cost_items(expenses).select do |item|
      total_expenses.positive? && (item[:amount] / total_expenses) >= 0.3
    end

    {
      deficitMonths: deficit_months,
      spendingSpikes: spikes,
      criticalCostPosts: critical_posts
    }
  end
end
