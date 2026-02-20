# frozen_string_literal: true

class CreateConsolidatedExpenses < ActiveRecord::Migration[8.1]
  def up
    drop_table :academy_training_expenses, if_exists: true
    drop_table :design_expenses, if_exists: true

    create_table :expenses do |t|
      t.string :supplier, null: false
      t.string :status, null: false, default: "processing"
      t.date :invoice_date, null: false
      t.string :category
      t.string :expense_type, null: false
      t.string :billing_zone
      t.date :payment_date
      t.string :payment_type
      t.decimal :amount_excl_vat, precision: 12, scale: 2, default: 0, null: false
      t.string :vat_rate
      t.decimal :vat_6, precision: 12, scale: 2, default: 0, null: false
      t.decimal :vat_12, precision: 12, scale: 2, default: 0, null: false
      t.decimal :vat_21, precision: 12, scale: 2, default: 0, null: false
      t.decimal :total_incl_vat, precision: 12, scale: 2, default: 0, null: false
      t.string :eu_vat_rate
      t.decimal :eu_vat_amount, precision: 12, scale: 2, default: 0, null: false
      t.string :paid_by
      t.boolean :reimbursed, default: false, null: false
      t.date :reimbursement_date
      t.boolean :billable_to_client, default: false, null: false
      t.string :rebilling_status
      t.text :description, default: "", null: false
      t.text :notes, default: "", null: false
      t.string :poles, array: true, default: []
      t.references :design_project, null: true, foreign_key: { to_table: :design_projects }
      t.references :training, null: true, foreign_key: { to_table: :academy_trainings }

      t.timestamps
    end
  end

  def down
    drop_table :expenses, if_exists: true

    create_table :academy_training_expenses do |t|
      t.decimal :amount, precision: 12, scale: 2, default: 0.0, null: false
      t.string :category, null: false
      t.date :date, null: false
      t.text :description, default: "", null: false
      t.references :training, null: false, foreign_key: { to_table: :academy_trainings }

      t.timestamps
    end

    create_table :design_expenses do |t|
      t.decimal :amount, precision: 10, scale: 2, default: 0.0, null: false
      t.string :category, null: false
      t.date :date, null: false
      t.text :description, default: "", null: false
      t.string :member_id, default: "", null: false
      t.string :member_name, default: "", null: false
      t.string :phase, null: false
      t.references :project, null: false, foreign_key: { to_table: :design_projects }
      t.string :receipt_url, default: "", null: false
      t.string :status, default: "pending", null: false

      t.timestamps
    end
  end
end
