class CreateCredentials < ActiveRecord::Migration[8.1]
  def change
    create_table :credentials do |t|
      t.references :guild, null: false, foreign_key: true
      t.string :service_name, null: false
      t.string :username
      t.string :password
      t.string :url
      t.text :notes
      t.references :created_by, null: true, foreign_key: { to_table: :members }
      t.timestamps
    end
  end
end
