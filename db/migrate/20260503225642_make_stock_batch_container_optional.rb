class MakeStockBatchContainerOptional < ActiveRecord::Migration[8.1]
  def change
    change_column_null :nursery_stock_batches, :container_id, true
  end
end
