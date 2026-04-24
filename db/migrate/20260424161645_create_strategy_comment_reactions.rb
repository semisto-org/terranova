class CreateStrategyCommentReactions < ActiveRecord::Migration[8.1]
  def change
    create_table :strategy_comment_reactions do |t|
      t.references :comment,
        null: false,
        foreign_key: { to_table: :strategy_deliberation_comments },
        index: true
      t.references :member, null: false, foreign_key: true, index: true
      t.string :emoji, null: false

      t.timestamps
    end

    add_index :strategy_comment_reactions,
      [:comment_id, :member_id, :emoji],
      unique: true,
      name: "index_strategy_comment_reactions_uniqueness"
  end
end
