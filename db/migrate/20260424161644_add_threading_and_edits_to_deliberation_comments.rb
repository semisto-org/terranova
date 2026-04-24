class AddThreadingAndEditsToDeliberationComments < ActiveRecord::Migration[8.1]
  def change
    add_reference :strategy_deliberation_comments, :parent,
      foreign_key: { to_table: :strategy_deliberation_comments },
      null: true,
      index: true

    add_column :strategy_deliberation_comments, :edited_at, :datetime
    add_column :strategy_deliberation_comments, :deleted_at, :datetime

    add_index :strategy_deliberation_comments,
      [:deliberation_id, :parent_id, :created_at],
      name: "index_strategy_deliberation_comments_on_delib_parent_created"
  end
end
