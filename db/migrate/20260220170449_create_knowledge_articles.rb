class CreateKnowledgeArticles < ActiveRecord::Migration[8.0]
  def change
    create_table :knowledge_articles do |t|
      t.string :title, null: false
      t.text :content, null: false
      t.text :summary
      t.string :category, null: false, default: "other"
      t.json :tags, default: []
      t.string :source_url
      t.integer :lab_id
      t.string :pole
      t.boolean :pinned, default: false
      t.string :status, null: false, default: "draft"
      t.string :author_name

      t.timestamps
    end

    add_index :knowledge_articles, :category
    add_index :knowledge_articles, :status
    add_index :knowledge_articles, :pole
    add_index :knowledge_articles, :lab_id
    add_index :knowledge_articles, :pinned
  end
end
