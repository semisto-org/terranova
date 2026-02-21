class AddMemberKindToMembers < ActiveRecord::Migration[7.2]
  def change
    add_column :members, :member_kind, :string, default: "human", null: false
  end
end
