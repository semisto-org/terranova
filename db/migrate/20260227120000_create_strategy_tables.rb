# frozen_string_literal: true

class CreateStrategyTables < ActiveRecord::Migration[8.0]
  def change
    # 1. Resources — strategic library
    create_table :strategy_resources do |t|
      t.string :title, null: false
      t.text :summary
      t.text :content
      t.string :source_url
      t.string :resource_type, null: false, default: "article"
      t.jsonb :tags, default: []
      t.boolean :pinned, default: false
      t.references :created_by, foreign_key: { to_table: :members }
      t.timestamps
    end
    add_index :strategy_resources, :resource_type
    add_index :strategy_resources, :pinned

    # 2. Deliberations — structured discussions with sociocratic consent
    create_table :strategy_deliberations do |t|
      t.string :title, null: false
      t.text :context
      t.string :status, null: false, default: "open"
      t.string :decision_mode, default: "consent"
      t.text :outcome
      t.datetime :decided_at
      t.references :created_by, foreign_key: { to_table: :members }
      t.timestamps
    end
    add_index :strategy_deliberations, :status

    # 3. Proposals — within a deliberation
    create_table :strategy_proposals do |t|
      t.references :deliberation, null: false, foreign_key: { to_table: :strategy_deliberations }
      t.references :author, null: false, foreign_key: { to_table: :members }
      t.text :content, null: false
      t.string :status, default: "pending"
      t.timestamps
    end

    # 4. Reactions — sociocratic reactions to proposals
    create_table :strategy_reactions do |t|
      t.references :proposal, null: false, foreign_key: { to_table: :strategy_proposals }
      t.references :member, null: false, foreign_key: { to_table: :members }
      t.string :position, null: false
      t.text :rationale
      t.timestamps
    end
    add_index :strategy_reactions, [:proposal_id, :member_id], unique: true

    # 5. Deliberation comments — free discussion thread
    create_table :strategy_deliberation_comments do |t|
      t.references :deliberation, null: false, foreign_key: { to_table: :strategy_deliberations }
      t.references :author, foreign_key: { to_table: :members }
      t.text :content, null: false
      t.timestamps
    end

    # 6. Frameworks — governance documents
    create_table :strategy_frameworks do |t|
      t.string :title, null: false
      t.text :content, null: false
      t.string :framework_type, null: false, default: "charter"
      t.string :status, default: "draft"
      t.integer :version, default: 1
      t.references :deliberation, foreign_key: { to_table: :strategy_deliberations }
      t.references :created_by, foreign_key: { to_table: :members }
      t.timestamps
    end
    add_index :strategy_frameworks, :framework_type
    add_index :strategy_frameworks, :status

    # 7. Axes — strategic objectives
    create_table :strategy_axes do |t|
      t.string :title, null: false
      t.text :description
      t.string :status, default: "active"
      t.integer :target_year
      t.integer :progress, default: 0
      t.string :color
      t.integer :position, default: 0
      t.references :created_by, foreign_key: { to_table: :members }
      t.timestamps
    end
    add_index :strategy_axes, :status
    add_index :strategy_axes, :position

    # 8. Key results — OKR-style results under each axis
    create_table :strategy_key_results do |t|
      t.references :axis, null: false, foreign_key: { to_table: :strategy_axes }
      t.string :title, null: false
      t.string :metric_type, default: "percentage"
      t.decimal :target_value
      t.decimal :current_value, default: 0
      t.string :status, default: "on_track"
      t.integer :position, default: 0
      t.timestamps
    end
  end
end
