class RemoveIndexMembersOnSlackUserId < ActiveRecord::Migration[8.1]
  def change
    remove_index :members, :slack_user_id
  end
end
