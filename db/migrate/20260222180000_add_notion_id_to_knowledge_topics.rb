class AddNotionIdToKnowledgeTopics < ActiveRecord::Migration[8.0]
  def change
    add_column :knowledge_topics, :notion_id, :string
    add_column :knowledge_topics, :source_url, :string
    add_column :knowledge_topics, :notion_created_at, :datetime
    add_column :knowledge_topics, :notion_updated_at, :datetime
    add_index :knowledge_topics, :notion_id, unique: true
  end
end
