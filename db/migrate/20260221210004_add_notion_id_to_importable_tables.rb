# frozen_string_literal: true

class AddNotionIdToImportableTables < ActiveRecord::Migration[7.1]
  def change
    add_column :academy_trainings, :notion_id, :string
    add_column :academy_training_locations, :notion_id, :string
    add_column :contacts, :notion_id, :string
    add_column :expenses, :notion_id, :string
    add_column :revenues, :notion_id, :string

    add_index :academy_trainings, :notion_id, unique: true
    add_index :academy_training_locations, :notion_id, unique: true
    add_index :contacts, :notion_id, unique: true
    add_index :expenses, :notion_id, unique: true
    add_index :revenues, :notion_id, unique: true
  end
end
