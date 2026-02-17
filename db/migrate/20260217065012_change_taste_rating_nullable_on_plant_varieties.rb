class ChangeTasteRatingNullableOnPlantVarieties < ActiveRecord::Migration[8.0]
  def change
    change_column_null :plant_varieties, :taste_rating, true
    change_column_default :plant_varieties, :taste_rating, from: 3, to: nil
  end
end
