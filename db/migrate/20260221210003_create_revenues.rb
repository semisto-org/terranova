# frozen_string_literal: true

class CreateRevenues < ActiveRecord::Migration[7.1]
  def change
    create_table :revenues do |t|
      t.decimal :amount, precision: 12, scale: 2, default: "0.0", null: false
      t.text :description, default: "", null: false
      t.date :date
      t.references :contact, foreign_key: true, null: true
      t.string :pole
      t.references :training, foreign_key: { to_table: :academy_trainings }, null: true
      t.references :design_project, foreign_key: true, null: true
      t.string :revenue_type, default: "", null: false
      t.string :status, default: "draft", null: false
      t.text :notes, default: "", null: false
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :revenues, :deleted_at
    add_index :revenues, :pole
  end
end
