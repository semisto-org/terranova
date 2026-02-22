class AddMembershipTypeToMembers < ActiveRecord::Migration[8.0]
  def change
    add_column :members, :membership_type, :string, default: "effective", null: false
  end
end
