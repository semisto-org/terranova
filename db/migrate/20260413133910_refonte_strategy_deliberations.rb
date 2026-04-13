class RefonteStrategyDeliberations < ActiveRecord::Migration[8.1]
  def up
    # --- strategy_deliberations ---
    add_column :strategy_deliberations, :opened_at, :datetime
    add_column :strategy_deliberations, :voting_started_at, :datetime
    add_column :strategy_deliberations, :voting_deadline, :datetime

    change_column_default :strategy_deliberations, :status, from: "open", to: "draft"
    execute "UPDATE strategy_deliberations SET status = 'draft'"

    remove_column :strategy_deliberations, :decision_mode

    # --- strategy_proposals ---
    add_column :strategy_proposals, :version, :integer, default: 1, null: false
    remove_column :strategy_proposals, :status

    # Deduplicate proposals per deliberation (keep the oldest)
    execute <<~SQL
      DELETE FROM strategy_proposals
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (PARTITION BY deliberation_id ORDER BY created_at ASC, id ASC) AS rn
          FROM strategy_proposals
        ) ranked
        WHERE rn > 1
      )
    SQL

    if index_exists?(:strategy_proposals, :deliberation_id, name: "index_strategy_proposals_on_deliberation_id")
      remove_index :strategy_proposals, name: "index_strategy_proposals_on_deliberation_id"
    end
    add_index :strategy_proposals, :deliberation_id, unique: true,
      name: "index_strategy_proposals_on_deliberation_id_unique"

    # --- strategy_proposal_versions (new) ---
    create_table :strategy_proposal_versions do |t|
      t.references :proposal, null: false,
        foreign_key: { to_table: :strategy_proposals, on_delete: :cascade }
      t.integer :version, null: false
      t.text :content, null: false
      t.datetime :created_at, null: false
      t.index [:proposal_id, :version], unique: true,
        name: "index_strategy_proposal_versions_unique"
    end

    # Backfill: create v1 for every existing proposal
    execute <<~SQL
      INSERT INTO strategy_proposal_versions (proposal_id, version, content, created_at)
      SELECT id, 1, content, created_at FROM strategy_proposals
    SQL

    # --- strategy_reactions ---
    execute "DELETE FROM strategy_reactions WHERE position IN ('abstain', 'amendment')"

    # Revert to simple unique index on [proposal_id, member_id]
    if index_exists?(:strategy_reactions, [:proposal_id, :member_id], name: "index_strategy_reactions_unique_non_amendment")
      remove_index :strategy_reactions, name: "index_strategy_reactions_unique_non_amendment"
    end
    if index_exists?(:strategy_reactions, [:proposal_id, :member_id], name: "index_strategy_reactions_on_proposal_id_and_member_id")
      remove_index :strategy_reactions, name: "index_strategy_reactions_on_proposal_id_and_member_id"
    end
    add_index :strategy_reactions, [:proposal_id, :member_id], unique: true,
      name: "index_strategy_reactions_on_proposal_id_and_member_id"

    # --- strategy_deliberation_comments ---
    add_column :strategy_deliberation_comments, :phase_at_creation, :string,
      null: false, default: "draft"
  end

  def down
    remove_column :strategy_deliberation_comments, :phase_at_creation

    if index_exists?(:strategy_reactions, [:proposal_id, :member_id], name: "index_strategy_reactions_on_proposal_id_and_member_id")
      remove_index :strategy_reactions, name: "index_strategy_reactions_on_proposal_id_and_member_id"
    end
    add_index :strategy_reactions, [:proposal_id, :member_id], unique: true,
      where: "position != 'amendment'",
      name: "index_strategy_reactions_unique_non_amendment"

    drop_table :strategy_proposal_versions

    if index_exists?(:strategy_proposals, :deliberation_id, name: "index_strategy_proposals_on_deliberation_id_unique")
      remove_index :strategy_proposals, name: "index_strategy_proposals_on_deliberation_id_unique"
    end
    add_index :strategy_proposals, :deliberation_id,
      name: "index_strategy_proposals_on_deliberation_id"

    add_column :strategy_proposals, :status, :string, default: "pending"
    remove_column :strategy_proposals, :version

    add_column :strategy_deliberations, :decision_mode, :string, default: "consent"
    execute "UPDATE strategy_deliberations SET status = 'open'"
    change_column_default :strategy_deliberations, :status, from: "draft", to: "open"
    remove_column :strategy_deliberations, :voting_deadline
    remove_column :strategy_deliberations, :voting_started_at
    remove_column :strategy_deliberations, :opened_at
  end
end
