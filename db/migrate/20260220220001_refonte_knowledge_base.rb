# frozen_string_literal: true

class RefonteKnowledgeBase < ActiveRecord::Migration[8.0]
  def change
    # 1. Rename knowledge_articles → knowledge_topics
    rename_table :knowledge_articles, :knowledge_topics

    # 2. Remove old columns from knowledge_topics
    remove_column :knowledge_topics, :summary, :text
    remove_column :knowledge_topics, :category, :string
    remove_column :knowledge_topics, :pole, :string
    remove_column :knowledge_topics, :source_url, :string
    remove_column :knowledge_topics, :lab_id, :integer

    # 3. Create knowledge_sections
    create_table :knowledge_sections do |t|
      t.string :name, null: false
      t.text :description
      t.integer :position, default: 0
      t.references :created_by, foreign_key: { to_table: :members }
      t.timestamps
    end

    # 4. Add new columns to knowledge_topics
    add_reference :knowledge_topics, :section, foreign_key: { to_table: :knowledge_sections }, null: true
    add_reference :knowledge_topics, :created_by, foreign_key: { to_table: :members }, null: true
    add_column :knowledge_topics, :reading_time_minutes, :integer, default: 1

    # 5. Create knowledge_topic_editors (co-authors)
    create_table :knowledge_topic_editors do |t|
      t.references :topic, null: false, foreign_key: { to_table: :knowledge_topics }
      t.references :user, null: false, foreign_key: { to_table: :members }
      t.datetime :edited_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
    end
    add_index :knowledge_topic_editors, [:topic_id, :user_id], unique: true

    # 6. Create knowledge_bookmarks
    create_table :knowledge_bookmarks do |t|
      t.references :user, null: false, foreign_key: { to_table: :members }
      t.references :topic, null: false, foreign_key: { to_table: :knowledge_topics }
      t.timestamps
    end
    add_index :knowledge_bookmarks, [:user_id, :topic_id], unique: true

    # 7. Create knowledge_topic_revisions
    create_table :knowledge_topic_revisions do |t|
      t.references :topic, null: false, foreign_key: { to_table: :knowledge_topics }
      t.references :user, foreign_key: { to_table: :members }
      t.string :user_name
      t.json :changes_data, default: {}
      t.timestamps
    end

    # 8. Create knowledge_comments
    create_table :knowledge_comments do |t|
      t.references :topic, null: false, foreign_key: { to_table: :knowledge_topics }
      t.references :user, foreign_key: { to_table: :members }
      t.string :author_name
      t.text :content, null: false
      t.timestamps
    end
  end
end
