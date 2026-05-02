class LinkStockBatchesToPlantDb < ActiveRecord::Migration[8.1]
  def up
    # 1. Resolve every distinct species_name in stock batches to a Plant::Species id.
    #    Create the species if missing (with sane defaults so existing batches don't block).
    species_resolution = {}
    distinct_names = execute(
      "SELECT DISTINCT species_name FROM nursery_stock_batches WHERE species_name IS NOT NULL AND species_name <> ''"
    ).map { |row| row['species_name'] }

    distinct_names.each do |latin_name|
      record = ::Plant::Species.find_or_create_by!(latin_name: latin_name) do |s|
        s.plant_type = 'herbaceous'
      end
      species_resolution[latin_name] = record.id
    end

    # 2. Resolve variety_name + species_id pairs to Plant::Variety ids (when both are present).
    variety_resolution = {}
    execute(
      "SELECT DISTINCT species_name, variety_name FROM nursery_stock_batches WHERE variety_name IS NOT NULL AND variety_name <> ''"
    ).each do |row|
      species_id = species_resolution[row['species_name']]
      next unless species_id

      record = ::Plant::Variety.find_or_create_by!(species_id: species_id, latin_name: row['variety_name'])
      variety_resolution[[row['species_name'], row['variety_name']]] = record.id
    end

    # 3. Add new bigint columns alongside the existing string columns.
    add_column :nursery_stock_batches, :species_ref_id, :bigint
    add_column :nursery_stock_batches, :variety_ref_id, :bigint

    # 4. Backfill the new columns.
    say_with_time 'Backfilling species_ref_id / variety_ref_id' do
      execute("UPDATE nursery_stock_batches SET species_ref_id = NULL, variety_ref_id = NULL")
      species_resolution.each do |latin_name, id|
        quoted = ActiveRecord::Base.connection.quote(latin_name)
        execute("UPDATE nursery_stock_batches SET species_ref_id = #{id} WHERE species_name = #{quoted}")
      end
      variety_resolution.each do |(species_name, variety_name), id|
        quoted_sn = ActiveRecord::Base.connection.quote(species_name)
        quoted_vn = ActiveRecord::Base.connection.quote(variety_name)
        execute(
          "UPDATE nursery_stock_batches SET variety_ref_id = #{id} WHERE species_name = #{quoted_sn} AND variety_name = #{quoted_vn}"
        )
      end
    end

    # 5. Drop the legacy string columns and rename the new ones into place.
    remove_column :nursery_stock_batches, :species_id
    remove_column :nursery_stock_batches, :variety_id
    rename_column :nursery_stock_batches, :species_ref_id, :species_id
    rename_column :nursery_stock_batches, :variety_ref_id, :variety_id

    change_column_null :nursery_stock_batches, :species_id, false
    add_index :nursery_stock_batches, :species_id
    add_index :nursery_stock_batches, :variety_id
    add_foreign_key :nursery_stock_batches, :plant_species, column: :species_id
    add_foreign_key :nursery_stock_batches, :plant_varieties, column: :variety_id

    # 6. Add the status + availability fields.
    add_column :nursery_stock_batches, :status, :string, default: 'available', null: false
    add_column :nursery_stock_batches, :expected_availability_on, :date
    add_column :nursery_stock_batches, :availability_label, :string, default: '', null: false
    add_index :nursery_stock_batches, :status
  end

  def down
    remove_index :nursery_stock_batches, :status
    remove_column :nursery_stock_batches, :availability_label
    remove_column :nursery_stock_batches, :expected_availability_on
    remove_column :nursery_stock_batches, :status

    remove_foreign_key :nursery_stock_batches, column: :variety_id
    remove_foreign_key :nursery_stock_batches, column: :species_id
    remove_index :nursery_stock_batches, :variety_id
    remove_index :nursery_stock_batches, :species_id

    # Convert FKs back to strings (lossy but reversible for dev).
    rename_column :nursery_stock_batches, :species_id, :species_ref_id
    rename_column :nursery_stock_batches, :variety_id, :variety_ref_id
    add_column :nursery_stock_batches, :species_id, :string
    add_column :nursery_stock_batches, :variety_id, :string, default: '', null: false

    execute("UPDATE nursery_stock_batches SET species_id = species_ref_id::text WHERE species_ref_id IS NOT NULL")
    execute("UPDATE nursery_stock_batches SET variety_id = COALESCE(variety_ref_id::text, '')")

    change_column_null :nursery_stock_batches, :species_id, false
    remove_column :nursery_stock_batches, :species_ref_id
    remove_column :nursery_stock_batches, :variety_ref_id
  end
end
