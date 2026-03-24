class AddColorToAcademyTrainingTypes < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_training_types, :color, :string, default: "#6B7280", null: false
  end
end
