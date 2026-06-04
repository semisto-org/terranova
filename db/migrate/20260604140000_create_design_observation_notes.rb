class CreateDesignObservationNotes < ActiveRecord::Migration[8.1]
  def change
    create_table :design_observation_notes do |t|
      t.references :project, null: false,
                             foreign_key: { to_table: :design_projects },
                             index: true
      t.text :body
      t.datetime :captured_at
      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 10, scale: 6

      t.timestamps
    end
  end
end
