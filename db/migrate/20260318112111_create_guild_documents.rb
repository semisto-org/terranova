class CreateGuildDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :guild_documents do |t|
      t.references :guild, null: false, foreign_key: true
      t.references :uploaded_by, null: true, foreign_key: { to_table: :members }
      t.string :name, null: false
      t.jsonb :tags, default: []
      t.timestamps
    end
  end
end
