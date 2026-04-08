# frozen_string_literal: true

class CreateBankConnections < ActiveRecord::Migration[8.1]
  def change
    create_table :bank_connections do |t|
      t.string :provider, null: false
      t.string :provider_requisition_id
      t.string :provider_account_id
      t.string :bank_name, null: false
      t.string :iban
      t.string :status, null: false, default: "linked"
      t.datetime :consent_expires_at
      t.datetime :last_synced_at
      t.bigint :connected_by_id, null: false

      t.timestamps
    end

    add_index :bank_connections, :provider_account_id, unique: true, where: "provider_account_id IS NOT NULL"
    add_index :bank_connections, :status
    add_foreign_key :bank_connections, :members, column: :connected_by_id
  end
end
