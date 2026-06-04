class CreateDesignSoilSamples < ActiveRecord::Migration[8.1]
  def change
    create_table :design_soil_samples do |t|
      t.references :project, null: false,
                             foreign_key: { to_table: :design_projects },
                             index: true
      t.string :location_label
      t.integer :depth_cm
      t.boolean :pollutant_flag, null: false, default: false
      t.string :lab_status, null: false, default: 'pending'
      t.jsonb :results, null: false, default: {}

      t.timestamps
    end
  end
end
