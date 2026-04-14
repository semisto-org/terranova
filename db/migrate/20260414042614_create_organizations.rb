class CreateOrganizations < ActiveRecord::Migration[8.1]
  def change
    create_table :organizations do |t|
      t.string :name, null: false
      t.string :legal_form
      t.string :registration_number
      t.text :address
      t.string :iban
      t.string :email
      t.string :phone
      t.boolean :is_default, null: false, default: false
      t.datetime :archived_at

      t.timestamps
    end

    add_index :organizations, :is_default
  end
end
