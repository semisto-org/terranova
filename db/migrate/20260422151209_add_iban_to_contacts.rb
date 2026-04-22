# frozen_string_literal: true

class AddIbanToContacts < ActiveRecord::Migration[8.1]
  def change
    add_column :contacts, :iban, :string
    add_index :contacts, :iban, where: "iban IS NOT NULL"
  end
end
