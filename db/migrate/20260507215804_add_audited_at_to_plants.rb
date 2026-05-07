class AddAuditedAtToPlants < ActiveRecord::Migration[8.1]
  def change
    add_column :plant_genera, :audited_at, :datetime
    add_column :plant_species, :audited_at, :datetime
    add_column :plant_varieties, :audited_at, :datetime
  end
end
