class AddSlackUserIdToMembers < ActiveRecord::Migration[8.0]
  def change
    add_column :members, :slack_user_id, :string
    add_index :members, :slack_user_id, unique: true
  end
end
