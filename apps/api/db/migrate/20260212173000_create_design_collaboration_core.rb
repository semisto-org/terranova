class CreateDesignCollaborationCore < ActiveRecord::Migration[7.1]
  def change
    create_table :design_quotes do |t|
      t.references :project, null: false, foreign_key: { to_table: :design_projects }
      t.integer :version, null: false, default: 1
      t.string :status, null: false, default: 'draft'
      t.string :title, null: false
      t.date :valid_until, null: false
      t.datetime :approved_at
      t.string :approved_by
      t.text :client_comment
      t.decimal :vat_rate, precision: 5, scale: 2, null: false, default: 21
      t.decimal :subtotal, precision: 12, scale: 2, null: false, default: 0
      t.decimal :vat_amount, precision: 12, scale: 2, null: false, default: 0
      t.decimal :total, precision: 12, scale: 2, null: false, default: 0
      t.timestamps
    end

    create_table :design_quote_lines do |t|
      t.references :quote, null: false, foreign_key: { to_table: :design_quotes }
      t.string :description, null: false
      t.decimal :quantity, precision: 10, scale: 2, null: false, default: 1
      t.string :unit, null: false, default: 'u'
      t.decimal :unit_price, precision: 12, scale: 2, null: false, default: 0
      t.decimal :total, precision: 12, scale: 2, null: false, default: 0
      t.timestamps
    end

    create_table :design_project_documents do |t|
      t.references :project, null: false, foreign_key: { to_table: :design_projects }
      t.string :category, null: false
      t.string :name, null: false
      t.string :url, null: false
      t.bigint :size, null: false, default: 0
      t.datetime :uploaded_at, null: false
      t.string :uploaded_by, null: false, default: 'team'
      t.timestamps
    end

    create_table :design_media_items do |t|
      t.references :project, null: false, foreign_key: { to_table: :design_projects }
      t.string :media_type, null: false
      t.string :url, null: false
      t.string :thumbnail_url, null: false, default: ''
      t.string :caption, null: false, default: ''
      t.datetime :taken_at, null: false
      t.datetime :uploaded_at, null: false
      t.string :uploaded_by, null: false, default: 'team'
      t.timestamps
    end

    create_table :design_annotations do |t|
      t.references :project, null: false, foreign_key: { to_table: :design_projects }
      t.string :document_id, null: false
      t.decimal :x, precision: 8, scale: 4, null: false
      t.decimal :y, precision: 8, scale: 4, null: false
      t.string :author_id, null: false
      t.string :author_name, null: false
      t.string :author_type, null: false
      t.text :content, null: false
      t.boolean :resolved, null: false, default: false
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false
    end

    create_table :design_client_contributions do |t|
      t.references :project, null: false, index: false, foreign_key: { to_table: :design_projects }
      t.string :client_id, null: false
      t.jsonb :terrain_questionnaire, null: false, default: {}
      t.jsonb :wishlist, null: false, default: []
      t.jsonb :plant_journal, null: false, default: []
      t.timestamps
    end
    add_index :design_client_contributions, :project_id, unique: true

    create_table :design_harvest_calendars do |t|
      t.references :project, null: false, index: false, foreign_key: { to_table: :design_projects }
      t.jsonb :months, null: false, default: []
      t.timestamps
    end
    add_index :design_harvest_calendars, :project_id, unique: true

    create_table :design_maintenance_calendars do |t|
      t.references :project, null: false, index: false, foreign_key: { to_table: :design_projects }
      t.jsonb :months, null: false, default: []
      t.timestamps
    end
    add_index :design_maintenance_calendars, :project_id, unique: true
  end
end
