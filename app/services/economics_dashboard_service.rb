class EconomicsDashboardService
  def initialize(filters = {})
    @filters = filters
  end

  def call
    inputs = filtered_inputs
    outputs = filtered_outputs

    total_inputs_cents = inputs.sum(:amount_cents)
    total_outputs_cents = outputs.sum(:amount_cents)
    area_m2 = resolve_area_m2

    {
      period: {
        from: filters[:from],
        to: filters[:to]
      },
      totals: {
        inputs_cents: total_inputs_cents,
        outputs_cents: total_outputs_cents,
        balance_cents: total_outputs_cents - total_inputs_cents
      },
      metrics: {
        area_m2: area_m2,
        productivity_eur_per_ha: productivity_eur_per_ha(total_outputs_cents, area_m2),
        cost_eur_per_m2: cost_eur_per_m2(total_inputs_cents, area_m2)
      },
      breakdown: {
        inputs_by_category_cents: inputs.group(:category).sum(:amount_cents),
        outputs_by_category_cents: outputs.group(:category).sum(:amount_cents)
      }
    }
  end

  private

  attr_reader :filters

  def filtered_inputs
    scope = EconomicInput.all
    apply_filters(scope)
  end

  def filtered_outputs
    scope = EconomicOutput.all
    apply_filters(scope)
  end

  def apply_filters(scope)
    scope = scope.where("date >= ?", filters[:from]) if filters[:from].present?
    scope = scope.where("date <= ?", filters[:to]) if filters[:to].present?
    scope = scope.where(location_id: filters[:location_id]) if filters[:location_id].present?
    scope = scope.where(zone_id: filters[:zone_id]) if filters[:zone_id].present?
    scope = scope.where(design_project_id: filters[:design_project_id]) if filters[:design_project_id].present?
    scope
  end

  def resolve_area_m2
    if filters[:zone_id].present?
      zone = Location::Zone.find_by(id: filters[:zone_id])
      return extract_area_m2(zone)
    end

    if filters[:location_id].present?
      location = Location.find_by(id: filters[:location_id])
      return extract_area_m2(location)
    end

    if filters[:design_project_id].present?
      project = Design::Project.find_by(id: filters[:design_project_id])
      return project&.area&.to_f if project&.respond_to?(:area)
    end

    nil
  end

  def extract_area_m2(record)
    return nil unless record

    if record.respond_to?(:area_m2) && record.area_m2.present?
      record.area_m2.to_f
    elsif record.respond_to?(:area) && record.area.present?
      record.area.to_f
    else
      nil
    end
  end

  def productivity_eur_per_ha(total_outputs_cents, area_m2)
    return nil if area_m2.blank? || area_m2.to_f <= 0

    ((total_outputs_cents.to_f / 100.0) / (area_m2.to_f / 10_000.0)).round(2)
  end

  def cost_eur_per_m2(total_inputs_cents, area_m2)
    return nil if area_m2.blank? || area_m2.to_f <= 0

    ((total_inputs_cents.to_f / 100.0) / area_m2.to_f).round(2)
  end
end
