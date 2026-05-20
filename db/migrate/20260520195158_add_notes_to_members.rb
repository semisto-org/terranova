class AddNotesToMembers < ActiveRecord::Migration[8.1]
  def change
    add_column :members, :notes, :text
    add_column :members, :notes_html, :text
  end
end
