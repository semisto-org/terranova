class CreateAcademyHolidays < ActiveRecord::Migration[8.1]
  def change
    create_table :academy_holidays do |t|
      t.date :date, null: false
      t.timestamps
    end

    add_index :academy_holidays, :date, unique: true
  end
end
