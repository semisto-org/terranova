class CreateAcademyParticipantCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :academy_participant_categories do |t|
      t.references :training, null: false, foreign_key: { to_table: :academy_trainings }
      t.string     :label, null: false
      t.decimal    :price, precision: 12, scale: 2, null: false, default: 0.0
      t.integer    :max_spots, null: false, default: 0
      t.decimal    :deposit_amount, precision: 12, scale: 2, null: false, default: 0.0
      t.integer    :position, null: false, default: 0
      t.datetime   :deleted_at
      t.timestamps
    end
    add_index :academy_participant_categories, :deleted_at
  end
end
