class AddScaleDataAndDiameterToDesignPlantingPlans < ActiveRecord::Migration[8.1]
  def change
    add_column :design_planting_plans, :scale_data, :jsonb
    add_column :design_plant_markers, :diameter_cm, :integer
  end
end
