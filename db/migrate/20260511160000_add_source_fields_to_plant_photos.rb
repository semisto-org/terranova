class AddSourceFieldsToPlantPhotos < ActiveRecord::Migration[8.1]
  def change
    add_column :plant_photos, :license, :string
    add_column :plant_photos, :attribution_author, :string
    add_column :plant_photos, :source_platform, :string
  end
end
