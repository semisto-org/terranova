# frozen_string_literal: true

class CreateBillingSystem < ActiveRecord::Migration[8.0]
  def change
    create_table :bucket_transactions do |t|
      t.string     :projectable_type, null: false
      t.bigint     :projectable_id, null: false
      t.string     :kind, null: false
      t.decimal    :amount, precision: 12, scale: 2, null: false
      t.string     :description, null: false
      t.bigint     :member_id
      t.string     :member_name
      t.bigint     :recorded_by_id, null: false
      t.string     :recorded_by_name, null: false
      t.date       :date, null: false
      t.datetime   :deleted_at
      t.timestamps
    end

    add_index :bucket_transactions, [:projectable_type, :projectable_id], name: "index_bucket_transactions_on_projectable"
    add_index :bucket_transactions, :kind
    add_index :bucket_transactions, :deleted_at
    add_index :bucket_transactions, :member_id

    create_table :billing_config do |t|
      t.decimal :hourly_rate, precision: 8, scale: 2, default: 60.0, null: false
      t.decimal :asbl_support_rate, precision: 5, scale: 4, default: 0.15, null: false
      t.timestamps
    end
  end
end
