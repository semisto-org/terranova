class CreatePlantIllustrationJobs < ActiveRecord::Migration[8.1]
  def change
    create_table :plant_illustration_jobs do |t|
      t.references :species, null: false, foreign_key: { to_table: :plant_species }
      t.references :triggered_by, null: false, foreign_key: { to_table: :members }
      t.string :status, null: false, default: "pending"
      t.string :kind, null: false
      t.text :feedback
      t.text :prompt_used
      t.string :vds_version
      t.timestamp :triggered_at, null: false
      t.timestamp :started_at
      t.timestamp :finished_at
      t.text :error_message
      t.string :error_class
      t.integer :gemini_attempts, default: 0, null: false
      t.bigint :byte_size

      t.timestamps
    end

    add_index :plant_illustration_jobs, :status
    add_index :plant_illustration_jobs, :triggered_at, order: { triggered_at: :desc }
  end
end
