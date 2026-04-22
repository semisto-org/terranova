class MakeBankConnectionConnectedByNullable < ActiveRecord::Migration[8.1]
  def change
    change_column_null :bank_connections, :connected_by_id, true
  end
end
