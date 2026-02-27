# frozen_string_literal: true

class ImpactDashboardService
  POTENTIAL_PHASES    = %w[offre pre-projet].freeze
  IN_PROGRESS_PHASES  = %w[projet-detaille mise-en-oeuvre co-gestion].freeze
  TRANSFORMED_PHASES  = %w[termine].freeze

  ALL_LAYERS = %w[canopy sub-canopy shrub herbaceous ground-cover vine root].freeze
  ALL_PRODUCT_TYPES = %w[fruits feuilles fleurs racines écorce sève].freeze

  def call
    {
      hectares: hectares_data,
      functionalDiversity: functional_diversity_data,
      foodAutonomy: food_autonomy_data,
      nursery: nursery_data,
      academy: academy_data,
      members: members_data,
      plantHealth: plant_health_data,
      geographic: geographic_data,
      lastUpdatedAt: Time.current.iso8601
    }
  end

  private

  # ── 1. HECTARES FUNNEL ──────────────────────────────────────────────

  def hectares_data
    base = active_projects

    potential_m2   = base.where(phase: POTENTIAL_PHASES).sum(:area)
    in_progress_m2 = base.where(phase: IN_PROGRESS_PHASES).sum(:area)
    transformed_m2 = base.where(phase: TRANSFORMED_PHASES).sum(:area)
    total_m2       = potential_m2 + in_progress_m2 + transformed_m2

    {
      potentialHa:   m2_to_ha(potential_m2),
      inProgressHa:  m2_to_ha(in_progress_m2),
      transformedHa: m2_to_ha(transformed_m2),
      totalHa:       m2_to_ha(total_m2),
      projectCounts: {
        potential:   base.where(phase: POTENTIAL_PHASES).count,
        inProgress:  base.where(phase: IN_PROGRESS_PHASES).count,
        transformed: base.where(phase: TRANSFORMED_PHASES).count
      }
    }
  end

  # ── 2. FUNCTIONAL DIVERSITY ─────────────────────────────────────────

  def functional_diversity_data
    items = active_palette_items

    layers_present = items.distinct.pluck(:layer).compact
    layer_coverage_pct = ALL_LAYERS.empty? ? 0.0 : (layers_present.size.to_f / ALL_LAYERS.size * 100).round(1)

    distinct_species_count = items.where.not(species_id: [nil, ""]).distinct.count(:species_id)

    layer_quantities = items.group(:layer).sum(:quantity)
    total_qty = layer_quantities.values.sum.to_f

    shannon_index = if total_qty > 0
      layer_quantities.values.inject(0.0) do |sum, count|
        p = count.to_f / total_qty
        p > 0 ? sum + (-p * Math.log(p)) : sum
      end.round(3)
    else
      0.0
    end

    max_shannon = Math.log(ALL_LAYERS.size)
    shannon_normalized = total_qty > 0 && max_shannon > 0 ? ((shannon_index / max_shannon) * 100).round(1) : 0.0

    layer_breakdown = ALL_LAYERS.map do |layer|
      qty = layer_quantities[layer] || 0
      species = items.where(layer: layer).where.not(species_id: [nil, ""]).distinct.count(:species_id)
      { layer: layer, quantity: qty, speciesCount: species }
    end

    {
      distinctSpeciesCount: distinct_species_count,
      layersCovered:       layers_present.size,
      totalLayers:         ALL_LAYERS.size,
      layerCoveragePct:    layer_coverage_pct,
      shannonIndex:        shannon_index,
      shannonNormalizedPct: shannon_normalized,
      layerBreakdown:      layer_breakdown
    }
  end

  # ── 3. FOOD AUTONOMY ───────────────────────────────────────────────

  def food_autonomy_data
    items = active_palette_items

    # Monthly harvest coverage
    all_months = items
      .where("jsonb_array_length(COALESCE(harvest_months, '[]'::jsonb)) > 0")
      .pluck(:harvest_months)
      .flatten.compact.uniq.sort
    months_covered = all_months.size
    monthly_coverage_pct = (months_covered.to_f / 12 * 100).round(1)

    monthly_breakdown = (1..12).map do |m|
      count = items.where("harvest_months @> ?", [m].to_json).count
      { month: m, itemCount: count }
    end

    # Product type coverage
    all_products = items
      .where("jsonb_array_length(COALESCE(harvest_products, '[]'::jsonb)) > 0")
      .pluck(:harvest_products)
      .flatten.compact.uniq.sort

    # Edible species ratio
    items_with_harvest = items.where("jsonb_array_length(COALESCE(harvest_products, '[]'::jsonb)) > 0").count
    total_items = items.count
    edible_ratio_pct = total_items > 0 ? (items_with_harvest.to_f / total_items * 100).round(1) : 0.0

    # Placeholder autonomy score — will be replaced by real yield-based calculation
    placeholder_score = compute_placeholder_autonomy_score(monthly_coverage_pct, edible_ratio_pct, all_products.size)

    {
      placeholderScore:      placeholder_score,
      isEstimate:            true,
      monthsCovered:         months_covered,
      monthlyCoveragePct:    monthly_coverage_pct,
      monthlyBreakdown:      monthly_breakdown,
      productsCovered:       all_products.size,
      productTypes:          all_products,
      edibleSpeciesRatioPct: edible_ratio_pct
    }
  end

  # ── 4. NURSERY ──────────────────────────────────────────────────────

  def nursery_data
    batches = Nursery::StockBatch.where(deleted_at: nil)
    total_produced   = batches.sum(:quantity)
    distinct_species = batches.where.not(species_id: [nil, ""]).distinct.count(:species_id)

    distributed = Nursery::OrderLine
      .joins(:order)
      .where(nursery_orders: { status: "picked-up" })
      .sum(:quantity)

    {
      totalProduced:   total_produced,
      totalDistributed: distributed,
      distinctSpecies: distinct_species
    }
  end

  # ── 5. ACADEMY ──────────────────────────────────────────────────────

  def academy_data
    completed = Academy::Training.where(status: "completed", deleted_at: nil)
    training_ids = completed.pluck(:id)

    people_trained = if training_ids.any?
      Academy::TrainingRegistration
        .where(training_id: training_ids, deleted_at: nil)
        .count
    else
      0
    end

    {
      trainingsCompleted: completed.count,
      peopleTrained:      people_trained
    }
  end

  # ── 6. MEMBERS ──────────────────────────────────────────────────────

  def members_data
    active_members = Member.where(status: "active")
    total = active_members.count
    effective = active_members.where(membership_type: "effective").count
    adherent = active_members.where(membership_type: "adherent").count

    {
      total:     total,
      effective: effective,
      adherent:  adherent
    }
  end

  # ── 7. PLANT HEALTH ─────────────────────────────────────────────────

  def plant_health_data
    records = Design::PlantRecord
      .joins(:project)
      .where(design_projects: { deleted_at: nil })

    total = records.count
    alive = records.where(status: "alive").count
    survival_pct = total > 0 ? (alive.to_f / total * 100).round(1) : nil
    avg_health = total > 0 ? records.average(:health_score)&.to_f&.round(1) : nil

    {
      totalPlantRecords: total,
      aliveCount:        alive,
      survivalRatePct:   survival_pct,
      avgHealthScore:    avg_health
    }
  end

  # ── 7. GEOGRAPHIC SPREAD ────────────────────────────────────────────

  def geographic_data
    projects = active_projects

    type_breakdown = %w[prive professionnel collectif public].map do |type|
      { type: type, count: projects.where(project_type: type).count }
    end

    {
      distinctCities:    projects.where.not(city: [nil, ""]).distinct.count(:city),
      distinctCountries: projects.where.not(country_name: [nil, ""]).distinct.count(:country_name),
      projectTypeBreakdown: type_breakdown
    }
  end

  # ── HELPERS ─────────────────────────────────────────────────────────

  def active_projects
    Design::Project.where(deleted_at: nil)
  end

  def active_palette_items
    Design::ProjectPaletteItem
      .where(deleted_at: nil)
      .joins(palette: :project)
      .where(design_projects: { deleted_at: nil })
  end

  def m2_to_ha(m2)
    (m2.to_f / 10_000.0).round(2)
  end

  def compute_placeholder_autonomy_score(monthly_coverage_pct, edible_ratio_pct, product_count)
    product_coverage_pct = ALL_PRODUCT_TYPES.empty? ? 0.0 : (product_count.to_f / ALL_PRODUCT_TYPES.size * 100).clamp(0, 100)
    ((monthly_coverage_pct * 0.4 + edible_ratio_pct * 0.35 + product_coverage_pct * 0.25)).round(1)
  end
end
