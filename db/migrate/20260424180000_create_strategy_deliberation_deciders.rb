class CreateStrategyDeliberationDeciders < ActiveRecord::Migration[8.1]
  def change
    create_table :strategy_deliberation_deciders do |t|
      t.references :deliberation,
                   null: false,
                   foreign_key: { to_table: :strategy_deliberations, on_delete: :cascade },
                   index: { name: "idx_strategy_deciders_on_deliberation" }
      t.references :member, null: false, foreign_key: true
      t.timestamps
    end

    add_index :strategy_deliberation_deciders,
              [:deliberation_id, :member_id],
              unique: true,
              name: "idx_strategy_deciders_uniq"
  end
end
