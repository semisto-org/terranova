# frozen_string_literal: true

class AddNotionImportFields < ActiveRecord::Migration[7.1]
  def change
    # Contacts: extra fields for Notion import
    change_table :contacts, bulk: true do |t|
      t.string :position, default: "", null: false
      t.string :region, default: "", null: false
      t.string :linkedin_url, default: "", null: false
      t.jsonb :expertise, default: [], null: false
      t.jsonb :teams, default: [], null: false
    end

    # Locations: extra fields
    change_table :academy_training_locations, bulk: true do |t|
      t.string :country, default: "", null: false
      t.string :location_type, default: "", null: false
      t.string :website_url, default: "", null: false
    end

    # Trainings: location and facilitator links
    change_table :academy_trainings, bulk: true do |t|
      t.bigint :location_id
      t.jsonb :facilitator_ids, default: [], null: false
    end

    # Registrations: notion_id
    add_column :academy_training_registrations, :notion_id, :string
    add_index :academy_training_registrations, :notion_id, unique: true

    # Revenues: extra fields for Notion import
    change_table :revenues, bulk: true do |t|
      t.string :label, default: "", null: false
      t.decimal :amount_excl_vat, precision: 12, scale: 2, default: "0.0", null: false
      t.decimal :vat_6, precision: 12, scale: 2, default: "0.0", null: false
      t.decimal :vat_21, precision: 12, scale: 2, default: "0.0", null: false
      t.string :payment_method, default: "", null: false
      t.string :category, default: "", null: false
      t.string :vat_rate, default: "", null: false
      t.boolean :vat_exemption, default: false, null: false
      t.string :invoice_url, default: "", null: false
      t.date :paid_at
    end
  end
end
