class CreateAcademyTrainingPacks < ActiveRecord::Migration[8.1]
  def change
    create_table :academy_training_packs do |t|
      t.references :training, null: false, foreign_key: { to_table: :academy_trainings }
      t.string :name, null: false
      t.decimal :price, precision: 12, scale: 2, null: false
      t.decimal :deposit_amount, precision: 12, scale: 2, default: 0, null: false
      t.integer :position, default: 0
      t.datetime :deleted_at
      t.timestamps
    end
    add_index :academy_training_packs, :deleted_at
  end
end
