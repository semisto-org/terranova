class AddDefaultCategoriesAndSettings < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_training_types, :default_categories, :jsonb, null: false, default: []

    create_table :academy_settings do |t|
      t.decimal :volume_discount_per_spot, precision: 5, scale: 2, null: false, default: 10.0
      t.decimal :volume_discount_max, precision: 5, scale: 2, null: false, default: 30.0
      t.timestamps
    end

    reversible do |dir|
      dir.up do
        execute <<~SQL
          INSERT INTO academy_settings (volume_discount_per_spot, volume_discount_max, created_at, updated_at)
          VALUES (10.0, 30.0, NOW(), NOW())
        SQL
      end
    end
  end
end
