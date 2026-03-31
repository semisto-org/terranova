class CreateAcademyRegistrationPacks < ActiveRecord::Migration[8.1]
  def change
    create_table :academy_registration_packs do |t|
      t.references :registration, null: false, foreign_key: { to_table: :academy_training_registrations }
      t.references :pack, null: false, foreign_key: { to_table: :academy_training_packs }
      t.integer :quantity, null: false, default: 1
      t.decimal :unit_price, precision: 12, scale: 2, null: false
      t.decimal :subtotal, precision: 12, scale: 2, null: false
      t.timestamps
    end
    add_index :academy_registration_packs, [:registration_id, :pack_id],
              unique: true, name: "idx_reg_packs_on_registration_and_pack"
  end
end
