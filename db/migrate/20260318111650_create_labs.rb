class CreateLabs < ActiveRecord::Migration[8.1]
  def change
    create_table :labs do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.timestamps
    end

    add_index :labs, :slug, unique: true

    create_table :lab_memberships do |t|
      t.references :lab, null: false, foreign_key: true
      t.references :member, null: false, foreign_key: true
      t.timestamps
    end

    add_index :lab_memberships, [:lab_id, :member_id], unique: true
  end
end
