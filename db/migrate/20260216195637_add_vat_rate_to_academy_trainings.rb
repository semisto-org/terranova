class AddVatRateToAcademyTrainings < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_trainings, :vat_rate, :decimal, precision: 5, scale: 2, default: 0.0, null: false
  end
end
