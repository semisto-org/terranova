class AddLastActivityAtToMembers < ActiveRecord::Migration[8.0]
  def change
    add_column :members, :last_activity_at, :datetime, null: true
  end
end
