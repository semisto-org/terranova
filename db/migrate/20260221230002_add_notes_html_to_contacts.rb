# frozen_string_literal: true

class AddNotesHtmlToContacts < ActiveRecord::Migration[7.1]
  def change
    add_column :contacts, :notes_html, :text, default: ""
  end
end
