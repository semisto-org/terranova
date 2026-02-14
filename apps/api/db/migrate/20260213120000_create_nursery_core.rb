class CreateNurseryCore < ActiveRecord::Migration[7.1]
  def change
    create_table :nursery_nurseries do |t|
      t.string :name, null: false
      t.string :nursery_type, null: false, default: 'semisto'
      t.string :integration, null: false, default: 'platform'
      t.string :address, null: false, default: ''
      t.string :city, null: false, default: ''
      t.string :postal_code, null: false, default: ''
      t.string :country, null: false, default: ''
      t.decimal :latitude, precision: 10, scale: 6, null: false, default: 0
      t.decimal :longitude, precision: 10, scale: 6, null: false, default: 0
      t.string :contact_name, null: false, default: ''
      t.string :contact_email, null: false, default: ''
      t.string :contact_phone, null: false, default: ''
      t.string :website, null: false, default: ''
      t.text :description, null: false, default: ''
      t.jsonb :specialties, null: false, default: []
      t.boolean :is_pickup_point, null: false, default: true
      t.timestamps
    end

    create_table :nursery_containers do |t|
      t.string :name, null: false
      t.string :short_name, null: false
      t.decimal :volume_liters, precision: 7, scale: 2
      t.text :description, null: false, default: ''
      t.integer :sort_order, null: false, default: 0
      t.timestamps
    end

    create_table :nursery_stock_batches do |t|
      t.references :nursery, null: false, foreign_key: { to_table: :nursery_nurseries }
      t.string :species_id, null: false
      t.string :species_name, null: false
      t.string :variety_id, null: false, default: ''
      t.string :variety_name, null: false, default: ''
      t.references :container, null: false, foreign_key: { to_table: :nursery_containers }
      t.integer :quantity, null: false, default: 0
      t.integer :available_quantity, null: false, default: 0
      t.integer :reserved_quantity, null: false, default: 0
      t.date :sowing_date
      t.string :origin, null: false, default: ''
      t.string :growth_stage, null: false, default: 'young'
      t.decimal :price_euros, precision: 12, scale: 2, null: false, default: 0
      t.boolean :accepts_semos, null: false, default: false
      t.decimal :price_semos, precision: 12, scale: 2
      t.text :notes, null: false, default: ''
      t.timestamps
    end

    create_table :nursery_mother_plants do |t|
      t.string :species_id, null: false
      t.string :species_name, null: false
      t.string :variety_id, null: false, default: ''
      t.string :variety_name, null: false, default: ''
      t.string :place_id, null: false, default: ''
      t.string :place_name, null: false, default: ''
      t.string :place_address, null: false, default: ''
      t.date :planting_date, null: false
      t.string :source, null: false, default: 'member-proposal'
      t.string :project_id, null: false, default: ''
      t.string :project_name, null: false, default: ''
      t.string :member_id, null: false, default: ''
      t.string :member_name, null: false, default: ''
      t.string :status, null: false, default: 'pending'
      t.datetime :validated_at
      t.string :validated_by, null: false, default: ''
      t.integer :quantity, null: false, default: 0
      t.text :notes, null: false, default: ''
      t.date :last_harvest_date
      t.timestamps
    end

    create_table :nursery_orders do |t|
      t.string :order_number, null: false
      t.string :customer_id, null: false, default: ''
      t.string :customer_name, null: false
      t.string :customer_email, null: false, default: ''
      t.string :customer_phone, null: false, default: ''
      t.boolean :is_member, null: false, default: false
      t.string :status, null: false, default: 'new'
      t.string :price_level, null: false, default: 'standard'
      t.references :pickup_nursery, null: false, foreign_key: { to_table: :nursery_nurseries }
      t.decimal :subtotal_euros, precision: 12, scale: 2, null: false, default: 0
      t.decimal :subtotal_semos, precision: 12, scale: 2, null: false, default: 0
      t.decimal :total_euros, precision: 12, scale: 2, null: false, default: 0
      t.decimal :total_semos, precision: 12, scale: 2, null: false, default: 0
      t.text :notes, null: false, default: ''
      t.datetime :prepared_at
      t.datetime :ready_at
      t.datetime :picked_up_at
      t.timestamps
    end
    add_index :nursery_orders, :order_number, unique: true
    add_index :nursery_orders, :status

    create_table :nursery_order_lines do |t|
      t.references :order, null: false, foreign_key: { to_table: :nursery_orders }
      t.references :stock_batch, null: false, foreign_key: { to_table: :nursery_stock_batches }
      t.references :nursery, null: false, foreign_key: { to_table: :nursery_nurseries }
      t.string :nursery_name, null: false
      t.string :species_name, null: false
      t.string :variety_name, null: false, default: ''
      t.string :container_name, null: false
      t.integer :quantity, null: false, default: 0
      t.decimal :unit_price_euros, precision: 12, scale: 2, null: false, default: 0
      t.decimal :unit_price_semos, precision: 12, scale: 2
      t.boolean :pay_in_semos, null: false, default: false
      t.decimal :total_euros, precision: 12, scale: 2, null: false, default: 0
      t.decimal :total_semos, precision: 12, scale: 2, null: false, default: 0
      t.timestamps
    end

    create_table :nursery_transfers do |t|
      t.references :order, null: false, foreign_key: { to_table: :nursery_orders }
      t.string :status, null: false, default: 'planned'
      t.jsonb :stops, null: false, default: []
      t.decimal :total_distance_km, precision: 8, scale: 2, null: false, default: 0
      t.string :estimated_duration, null: false, default: ''
      t.string :driver_id, null: false, default: ''
      t.string :driver_name, null: false, default: ''
      t.string :vehicle_info, null: false, default: ''
      t.date :scheduled_date, null: false
      t.text :notes, null: false, default: ''
      t.datetime :completed_at
      t.timestamps
    end
  end
end
