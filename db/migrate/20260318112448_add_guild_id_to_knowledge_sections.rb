class AddGuildIdToKnowledgeSections < ActiveRecord::Migration[8.1]
  def change
    add_reference :knowledge_sections, :guild, null: true, foreign_key: true

    # Remove existing uniqueness index on name if any, then add composite
    remove_index :knowledge_sections, :name if index_exists?(:knowledge_sections, :name)
    add_index :knowledge_sections, [:guild_id, :name], unique: true
  end
end
