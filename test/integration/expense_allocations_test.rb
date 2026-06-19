require "test_helper"

class ExpenseAllocationsTest < ActionDispatch::IntegrationTest
  setup do
    [
      ExpenseProjectAllocation,
      AlbumMediaItem,
      Album,
      Academy::TrainingAttendance,
      Academy::RegistrationPack,
      Expense,
      Academy::TrainingDocument,
      Academy::RegistrationItem,
      Academy::TrainingRegistration,
      Academy::TrainingPackItem,
      Academy::TrainingPack,
      Academy::TrainingSession,
      Academy::ParticipantCategory,
      Academy::Training,
      Academy::TrainingLocation,
      Academy::TrainingType,
      Academy::IdeaNote,
      ContactTag,
      Contact
    ].each(&:delete_all)

    @training_type = Academy::TrainingType.create!(name: "Permaculture", description: "Base")
    @training_a = Academy::Training.create!(training_type: @training_type, title: "Training A", status: "idea")
    @training_b = Academy::Training.create!(training_type: @training_type, title: "Training B", status: "idea")

    @split_expense = @training_a.expenses.create!(
      supplier: "Shared supplier",
      status: "processing",
      invoice_date: Date.new(2026, 1, 10),
      expense_type: "services_and_goods",
      category: "Shared",
      name: "Shared room",
      total_incl_vat: 300,
      amount_excl_vat: 240,
      vat_21: 60
    )
    ExpenseProjectAllocation.create!(expense: @split_expense, projectable: @training_a, amount: 100)
    ExpenseProjectAllocation.create!(expense: @split_expense, projectable: @training_b, amount: 150)

    @single_project_expense = @training_a.expenses.create!(
      supplier: "Local supplier",
      status: "processing",
      invoice_date: Date.new(2026, 1, 11),
      expense_type: "services_and_goods",
      category: "Local",
      name: "Local room",
      total_incl_vat: 50,
      amount_excl_vat: 40,
      vat_21: 10
    )
  end

  test "academy payload attributes split expenses to every allocated training" do
    get "/api/v1/academy", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    rows = body["trainingExpenses"]
    split_a = rows.find { |row| row["id"] == "#{@split_expense.id}-#{@training_a.id}" }
    split_b = rows.find { |row| row["id"] == "#{@split_expense.id}-#{@training_b.id}" }
    single = rows.find { |row| row["id"] == @single_project_expense.id.to_s }

    assert split_a, "expected split expense row for first training"
    assert split_b, "expected split expense row for second training"
    assert single, "expected non-split expense row"
    assert_equal 2, rows.count { |row| row["id"].start_with?("#{@split_expense.id}-") }
    assert_equal 1, rows.count { |row| row["id"] == @single_project_expense.id.to_s }

    assert_equal "Academy::Training", split_a["projectableType"]
    assert_equal @training_a.id.to_s, split_a["projectableId"]
    assert_equal true, split_a["isAllocation"]
    assert_in_delta 100.0, split_a["totalInclVat"], 0.01
    assert_in_delta 80.0, split_a["amountExclVat"], 0.01
    assert_in_delta 100.0, split_a["attributedAmountInclVat"], 0.01
    assert_in_delta 80.0, split_a["attributedAmountExclVat"], 0.01
    assert_in_delta 300.0, split_a["fullTotalInclVat"], 0.01

    assert_equal "Academy::Training", split_b["projectableType"]
    assert_equal @training_b.id.to_s, split_b["projectableId"]
    assert_equal true, split_b["isAllocation"]
    assert_in_delta 150.0, split_b["totalInclVat"], 0.01
    assert_in_delta 120.0, split_b["amountExclVat"], 0.01
    assert_in_delta 150.0, split_b["attributedAmountInclVat"], 0.01
    assert_in_delta 120.0, split_b["attributedAmountExclVat"], 0.01
    assert_in_delta 300.0, split_b["fullTotalInclVat"], 0.01

    assert_equal "Academy::Training", single["projectableType"]
    assert_equal @training_a.id.to_s, single["projectableId"]
    assert_equal false, single["isAllocation"]
    assert_in_delta 50.0, single["totalInclVat"], 0.01
    assert_in_delta 40.0, single["amountExclVat"], 0.01
    assert_in_delta 50.0, single["attributedAmountInclVat"], 0.01
    assert_in_delta 40.0, single["attributedAmountExclVat"], 0.01
    assert_in_delta 250.0, rows.select { |row| row["isAllocation"] }.sum { |row| row["totalInclVat"].to_f }, 0.01
  end

  test "academy reporting sums attributed HTVA by category without primary project double count" do
    get "/api/v1/academy/reporting", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_in_delta 240.0, body["totalExpenses"], 0.01
    assert_in_delta 200.0, body["expensesByCategory"]["Shared"], 0.01
    assert_in_delta 40.0, body["expensesByCategory"]["Local"], 0.01
  end
end
