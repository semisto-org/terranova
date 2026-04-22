require "test_helper"

class ExpenseCategoryTest < ActiveSupport::TestCase
  test "requires a label" do
    cat = ExpenseCategory.new(label: "")
    refute cat.valid?
    assert_includes cat.errors[:label], "can't be blank"
  end

  test "enforces case-insensitive label uniqueness among live records" do
    ExpenseCategory.create!(label: "Loyer")
    dup = ExpenseCategory.new(label: "loyer")
    refute dup.valid?
    assert_includes dup.errors[:label], "has already been taken"
  end

  test "ordered scope sorts case-insensitively by label" do
    ExpenseCategory.delete_all
    %w[loyer Assurances bibliothèque].each { |l| ExpenseCategory.create!(label: l) }
    assert_equal %w[Assurances bibliothèque loyer], ExpenseCategory.ordered.pluck(:label)
  end

  test "dependent restrict_with_error prevents destroy when expenses are attached" do
    cat = ExpenseCategory.create!(label: "Temporary #{SecureRandom.hex(4)}")
    Expense.create!(
      supplier: "Fournisseur test",
      status: "processing",
      expense_type: "services_and_goods",
      invoice_date: Date.current,
      expense_category: cat
    )
    refute cat.destroy
    assert_includes cat.errors[:base].to_s, "expenses"
  end

  test "soft delete hides the record from default scope but preserves it" do
    cat = ExpenseCategory.create!(label: "Temporary #{SecureRandom.hex(4)}")
    cat.soft_delete!
    refute ExpenseCategory.exists?(cat.id)
    assert ExpenseCategory.with_deleted.exists?(cat.id)
  end
end
