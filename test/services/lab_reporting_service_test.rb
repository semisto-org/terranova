require "test_helper"

class LabReportingServiceTest < ActiveSupport::TestCase
  setup do
    [Expense, Revenue].each(&:delete_all)

    Revenue.create!(amount: 1200, date: Date.new(2026, 1, 10), pole: "academy", status: "confirmed", category: "Formations")
    Revenue.create!(amount: 500, date: Date.new(2026, 2, 8), pole: "academy", status: "confirmed", category: "Formations")

    Expense.create!(total_incl_vat: 800, expense_type: "services_and_goods", status: "processing", supplier: "Alpha", invoice_date: Date.new(2026, 1, 12), category: "Prestations", poles: ["academy"])
    Expense.create!(total_incl_vat: 1300, expense_type: "services_and_goods", status: "processing", supplier: "Alpha", invoice_date: Date.new(2026, 2, 12), category: "Prestations", poles: ["academy"])
    Expense.create!(total_incl_vat: 150, expense_type: "services_and_goods", status: "processing", supplier: "Beta", invoice_date: Date.new(2026, 2, 13), category: "Frais généraux", poles: ["academy"])
  end

  test "computes financial KPIs and alerts" do
    result = LabReportingService.new(from: "2026-01-01", to: "2026-02-28", pole: "academy").call

    assert_equal 1700.0, result[:kpis][:revenues]
    assert_equal 2250.0, result[:kpis][:expenses]
    assert_equal(-550.0, result[:kpis][:netBalance])
    assert result[:kpis][:monthlyBurnRate] > 0

    assert_equal 2, result[:timeseries].size
    assert_includes result[:alerts][:deficitMonths], "2026-02"
    assert result[:alerts][:spendingSpikes].any?
    assert result[:topCostItems].any?
  end

  test "filters by category and supplier" do
    result = LabReportingService.new(from: "2026-01-01", to: "2026-02-28", pole: "academy", category: "Prestations", supplier: "Alpha").call

    assert_equal 1700.0, result[:kpis][:revenues]
    assert_equal 2100.0, result[:kpis][:expenses]
    assert_equal 1, result[:breakdowns][:byCategory].size
    assert_equal "Prestations", result[:breakdowns][:byCategory].first[:category]
  end
end
