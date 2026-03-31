class CreateAcademyTrainingPackItems < ActiveRecord::Migration[8.1]
  def change
    create_table :academy_training_pack_items do |t|
      t.references :pack, null: false, foreign_key: { to_table: :academy_training_packs }
      t.references :participant_category, null: false, foreign_key: { to_table: :academy_participant_categories }
      t.integer :quantity, null: false, default: 1
      t.timestamps
    end
    add_index :academy_training_pack_items, [:pack_id, :participant_category_id],
              unique: true, name: "idx_pack_items_on_pack_and_category"
  end
end
