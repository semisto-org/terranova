# frozen_string_literal: true

class AddMultiAccountFieldsToBankConnections < ActiveRecord::Migration[8.1]
  def change
    add_column :bank_connections, :institution_id, :string
    add_column :bank_connections, :accounting_scope, :string, null: false, default: "general"
    add_index :bank_connections, :accounting_scope
  end
end
