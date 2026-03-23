class CreateAcademyRegistrationItems < ActiveRecord::Migration[8.1]
  def change
    create_table :academy_registration_items do |t|
      t.references :registration, null: false, foreign_key: { to_table: :academy_training_registrations }
      t.references :participant_category, null: false, foreign_key: { to_table: :academy_participant_categories }
      t.integer    :quantity, null: false, default: 1
      t.decimal    :unit_price, precision: 12, scale: 2, null: false, default: 0.0
      t.decimal    :discount_percent, precision: 5, scale: 2, null: false, default: 0.0
      t.decimal    :subtotal, precision: 12, scale: 2, null: false, default: 0.0
      t.timestamps
    end
    add_index :academy_registration_items, [:registration_id, :participant_category_id],
              unique: true, name: 'idx_reg_items_unique'
  end
end
