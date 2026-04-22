class CreateExpenseCategories < ActiveRecord::Migration[8.1]
  # Legacy labels snapshotted from Expense::EXPENSE_CATEGORIES at the time
  # of this migration. Inlined here so the migration stays reproducible after
  # the constant is removed from the model.
  LEGACY_LABELS = [
    "Assurances",
    "Autres dépenses",
    "Bibliothèque",
    "Charges sociales",
    "Communication",
    "Contributions et adhésions",
    "Déplacements",
    "Entretien et réparations",
    "Événements",
    "Fournitures",
    "Frais bancaires",
    "Frais de formation",
    "Frais généraux",
    "Frais juridiques et comptables",
    "Hébergement et restauration",
    "In/out",
    "Indemnités et avantages",
    "Laboratoire",
    "Licences et abonnements",
    "Loyer",
    "Matériel et équipements",
    "Matériel plantations",
    "Plants",
    "Prestations",
    "Projets",
    "Projets innovants",
    "Publicité et promotion",
    "Relations publiques",
    "Rémunération des bénévoles",
    "Réserves",
    "Salaires",
    "Site web et médias sociaux",
    "Sponsoring",
    "Stock pour shop",
    "Subventions et aides",
    "Télécommunications",
    "Transport et logistique",
    "Visites et conférences"
  ].freeze

  def up
    create_table :expense_categories do |t|
      t.string :label, null: false
      t.datetime :deleted_at
      t.timestamps
    end
    add_index :expense_categories, :label, unique: true, where: "deleted_at IS NULL"
    add_index :expense_categories, :deleted_at

    add_reference :expenses, :expense_category, foreign_key: true, null: true

    # Seed the 39 legacy categories.
    now = Time.current
    rows = LEGACY_LABELS.map { |label| { label: label, created_at: now, updated_at: now } }
    connection.execute(<<~SQL) unless rows.empty?
      INSERT INTO expense_categories (label, created_at, updated_at) VALUES
      #{rows.map { |r| "(#{connection.quote(r[:label])}, #{connection.quote(r[:created_at])}, #{connection.quote(r[:updated_at])})" }.join(",\n")}
    SQL

    # Backfill expense_category_id on existing expenses by matching on label.
    connection.execute(<<~SQL)
      UPDATE expenses
      SET expense_category_id = ec.id
      FROM expense_categories ec
      WHERE expenses.category = ec.label
        AND expenses.expense_category_id IS NULL
    SQL
  end

  def down
    remove_reference :expenses, :expense_category, foreign_key: true
    drop_table :expense_categories
  end
end
