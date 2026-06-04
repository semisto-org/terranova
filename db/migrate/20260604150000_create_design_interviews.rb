class CreateDesignInterviews < ActiveRecord::Migration[8.1]
  def change
    create_table :design_interviews do |t|
      t.references :project, null: false,
                             foreign_key: { to_table: :design_projects },
                             index: { unique: true }
      t.jsonb :responses, null: false, default: {}
      t.text :notes

      t.timestamps
    end
  end
end
