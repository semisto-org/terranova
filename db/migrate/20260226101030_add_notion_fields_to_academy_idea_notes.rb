class AddNotionFieldsToAcademyIdeaNotes < ActiveRecord::Migration[8.1]
  def change
    add_column :academy_idea_notes, :notion_id, :string
    add_column :academy_idea_notes, :notion_created_at, :datetime
    add_column :academy_idea_notes, :notion_updated_at, :datetime
    add_index :academy_idea_notes, :notion_id, unique: true
  end
end
