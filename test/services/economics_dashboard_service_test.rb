require "test_helper"

class EconomicsDashboardServiceTest < ActiveSupport::TestCase
  test "computes totals breakdown and metrics" do
    project = Design::Project.create!(name: "P1", client_name: "Client", client_id: "c1", area: 2000)

    EconomicInput.create!(date: Date.new(2026, 2, 1), category: "plants", amount_cents: 10_000, quantity: 10, unit: "u", design_project: project)
    EconomicInput.create!(date: Date.new(2026, 2, 2), category: "labor", amount_cents: 5_000, quantity: 2, unit: "h", design_project: project)
    EconomicOutput.create!(date: Date.new(2026, 2, 3), category: "sale", amount_cents: 30_000, quantity: 12, unit: "kg", design_project: project)

    result = EconomicsDashboardService.new(design_project_id: project.id).call

    assert_equal 15_000, result[:totals][:inputs_cents]
    assert_equal 30_000, result[:totals][:outputs_cents]
    assert_equal 15_000, result[:totals][:balance_cents]
    assert_equal({ "plants" => 10_000, "labor" => 5_000 }, result[:breakdown][:inputs_by_category_cents])
    assert_equal({ "sale" => 30_000 }, result[:breakdown][:outputs_by_category_cents])
    assert_equal 1500.0, result[:metrics][:productivity_eur_per_ha]
    assert_equal 0.08, result[:metrics][:cost_eur_per_m2]
  end
end
