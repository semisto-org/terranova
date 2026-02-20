class CreateNurseryDocumentationEntries < ActiveRecord::Migration[7.1]
  def change
    create_table :nursery_documentation_entries do |t|
      t.string :entry_type, null: false, default: 'journal'
      t.string :title, null: false
      t.text :content, default: ''
      t.string :video_url, default: ''
      t.string :thumbnail_url, default: ''
      t.string :author_id, null: false
      t.string :author_name, null: false
      t.references :nursery, foreign_key: { to_table: :nursery_nurseries }
      t.string :nursery_name, default: ''
      t.jsonb :tags, default: [], null: false
      t.datetime :published_at, null: false
      t.timestamps
    end
  end
end
