# frozen_string_literal: true

class CreateContactsAndContactTags < ActiveRecord::Migration[8.1]
  def change
    create_table :contacts do |t|
      t.string :contact_type, null: false, default: "person"
      t.string :name, null: false
      t.string :email, default: ""
      t.string :phone, default: ""
      t.text :address, default: ""
      t.string :organization_type, default: ""
      t.text :notes, default: ""
      t.references :organization, foreign_key: { to_table: :contacts }

      t.timestamps
    end

    add_index :contacts, :contact_type
    add_index :contacts, :name

    create_table :contact_tags do |t|
      t.references :contact, null: false, foreign_key: true
      t.string :name, null: false

      t.timestamps
    end

    add_index :contact_tags, [:contact_id, :name], unique: true
    add_index :contact_tags, :name
  end
end
