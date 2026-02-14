class CreateAcademyCore < ActiveRecord::Migration[7.1]
  def change
    create_table :academy_training_types do |t|
      t.string :name, null: false
      t.text :description, null: false, default: ''
      t.jsonb :checklist_template, null: false, default: []
      t.jsonb :photo_gallery, null: false, default: []
      t.jsonb :trainer_ids, null: false, default: []
      t.timestamps
    end

    create_table :academy_training_locations do |t|
      t.string :name, null: false
      t.string :address, null: false, default: ''
      t.text :description, null: false, default: ''
      t.jsonb :photo_gallery, null: false, default: []
      t.jsonb :compatible_training_type_ids, null: false, default: []
      t.integer :capacity, null: false, default: 0
      t.boolean :has_accommodation, null: false, default: false
      t.timestamps
    end

    create_table :academy_trainings do |t|
      t.references :training_type, null: false, foreign_key: { to_table: :academy_training_types }
      t.string :title, null: false
      t.string :status, null: false, default: 'draft'
      t.decimal :price, precision: 12, scale: 2, null: false, default: 0
      t.integer :max_participants, null: false, default: 0
      t.boolean :requires_accommodation, null: false, default: false
      t.text :description, null: false, default: ''
      t.text :coordinator_note, null: false, default: ''
      t.jsonb :checklist_items, null: false, default: []
      t.jsonb :checked_items, null: false, default: []
      t.timestamps
    end
    add_index :academy_trainings, :status

    create_table :academy_training_sessions do |t|
      t.references :training, null: false, foreign_key: { to_table: :academy_trainings }
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.jsonb :location_ids, null: false, default: []
      t.jsonb :trainer_ids, null: false, default: []
      t.jsonb :assistant_ids, null: false, default: []
      t.text :description, null: false, default: ''
      t.timestamps
    end

    create_table :academy_training_registrations do |t|
      t.references :training, null: false, foreign_key: { to_table: :academy_trainings }
      t.string :contact_id, null: false, default: ''
      t.string :contact_name, null: false
      t.string :contact_email, null: false, default: ''
      t.decimal :amount_paid, precision: 12, scale: 2, null: false, default: 0
      t.string :payment_status, null: false, default: 'pending'
      t.text :internal_note, null: false, default: ''
      t.datetime :registered_at, null: false
      t.timestamps
    end

    create_table :academy_training_attendances do |t|
      t.references :registration, null: false, foreign_key: { to_table: :academy_training_registrations }
      t.references :session, null: false, foreign_key: { to_table: :academy_training_sessions }
      t.boolean :is_present, null: false, default: false
      t.text :note, null: false, default: ''
      t.timestamps
    end
    add_index :academy_training_attendances, [:registration_id, :session_id], unique: true, name: 'idx_academy_attendance_unique_pair'

    create_table :academy_training_documents do |t|
      t.references :training, null: false, foreign_key: { to_table: :academy_trainings }
      t.string :name, null: false
      t.string :document_type, null: false
      t.string :url, null: false
      t.datetime :uploaded_at, null: false
      t.string :uploaded_by, null: false, default: 'team'
      t.timestamps
    end

    create_table :academy_training_expenses do |t|
      t.references :training, null: false, foreign_key: { to_table: :academy_trainings }
      t.string :category, null: false
      t.text :description, null: false, default: ''
      t.decimal :amount, precision: 12, scale: 2, null: false, default: 0
      t.date :date, null: false
      t.timestamps
    end

    create_table :academy_idea_notes do |t|
      t.string :category, null: false
      t.string :title, null: false
      t.text :content, null: false, default: ''
      t.jsonb :tags, null: false, default: []
      t.timestamps
    end
  end
end
