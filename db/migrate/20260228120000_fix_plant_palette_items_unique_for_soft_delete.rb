# frozen_string_literal: true

class FixPlantPaletteItemsUniqueForSoftDelete < ActiveRecord::Migration[8.0]
  def change
    # Remove the old unique index that applies to all rows (including soft-deleted).
    # This caused PG::UniqueViolation when re-adding a species after removal.
    remove_index :plant_palette_items,
                 column: %i[palette_id item_type item_id],
                 name: "idx_on_palette_id_item_type_item_id_9890869de5"

    # Add partial unique index: only enforce uniqueness for non-deleted records.
    # Allows re-adding the same species/variety after soft-delete.
    add_index :plant_palette_items,
              %i[palette_id item_type item_id],
              unique: true,
              where: "deleted_at IS NULL",
              name: "index_plant_palette_items_on_palette_item_type_id_unique"
  end
end
