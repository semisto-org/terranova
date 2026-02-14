class CreateLabManagementCore < ActiveRecord::Migration[7.1]
  def change
    create_table :members do |t|
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :email, null: false
      t.string :avatar, null: false, default: ""
      t.string :status, null: false, default: "active"
      t.boolean :is_admin, null: false, default: false
      t.date :joined_at, null: false
      t.timestamps
    end
    add_index :members, :email, unique: true

    create_table :member_roles do |t|
      t.references :member, null: false, foreign_key: true
      t.string :role, null: false
      t.timestamps
    end
    add_index :member_roles, [:member_id, :role], unique: true

    create_table :guilds do |t|
      t.string :name, null: false
      t.text :description, null: false, default: ""
      t.references :leader, foreign_key: { to_table: :members }
      t.string :color, null: false, default: "blue"
      t.timestamps
    end

    create_table :guild_memberships do |t|
      t.references :guild, null: false, foreign_key: true
      t.references :member, null: false, foreign_key: true
      t.timestamps
    end
    add_index :guild_memberships, [:guild_id, :member_id], unique: true

    create_table :cycles do |t|
      t.string :name, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.date :cooldown_start, null: false
      t.date :cooldown_end, null: false
      t.string :status, null: false, default: "upcoming"
      t.timestamps
    end

    create_table :pitches do |t|
      t.string :title, null: false
      t.string :status, null: false, default: "raw"
      t.string :appetite, null: false
      t.references :author, foreign_key: { to_table: :members }
      t.text :problem, null: false
      t.text :solution, null: false
      t.jsonb :rabbit_holes, null: false, default: []
      t.jsonb :no_gos, null: false, default: []
      t.jsonb :breadboard
      t.text :fat_marker_sketch
      t.timestamps
    end

    create_table :bets do |t|
      t.references :pitch, null: false, foreign_key: true
      t.references :cycle, null: false, foreign_key: true
      t.string :status, null: false, default: "pending"
      t.references :placed_by, foreign_key: { to_table: :members }
      t.datetime :placed_at, null: false
      t.timestamps
    end

    create_table :bet_team_memberships do |t|
      t.references :bet, null: false, foreign_key: true
      t.references :member, null: false, foreign_key: true
      t.timestamps
    end
    add_index :bet_team_memberships, [:bet_id, :member_id], unique: true

    create_table :scopes do |t|
      t.references :pitch, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description, null: false, default: ""
      t.integer :hill_position, null: false, default: 0
      t.timestamps
    end

    create_table :scope_tasks do |t|
      t.references :scope, null: false, foreign_key: true
      t.string :title, null: false
      t.boolean :is_nice_to_have, null: false, default: false
      t.boolean :completed, null: false, default: false
      t.timestamps
    end

    create_table :hill_chart_snapshots do |t|
      t.references :pitch, null: false, foreign_key: true
      t.jsonb :positions, null: false, default: []
      t.timestamps
    end

    create_table :chowder_items do |t|
      t.references :pitch, null: false, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :members }
      t.string :title, null: false
      t.timestamps
    end

    create_table :idea_lists do |t|
      t.string :name, null: false
      t.text :description, null: false, default: ""
      t.timestamps
    end

    create_table :idea_items do |t|
      t.references :idea_list, null: false, foreign_key: true
      t.string :title, null: false
      t.integer :votes, null: false, default: 0
      t.timestamps
    end

    create_table :events do |t|
      t.string :title, null: false
      t.string :event_type, null: false
      t.datetime :start_date, null: false
      t.datetime :end_date, null: false
      t.string :location, null: false, default: ""
      t.text :description, null: false, default: ""
      t.references :cycle, foreign_key: true
      t.timestamps
    end

    create_table :event_attendees do |t|
      t.references :event, null: false, foreign_key: true
      t.references :member, null: false, foreign_key: true
      t.timestamps
    end
    add_index :event_attendees, [:event_id, :member_id], unique: true

    create_table :wallets do |t|
      t.references :member, null: false, foreign_key: true, index: { unique: true }
      t.integer :balance, null: false, default: 0
      t.integer :floor, null: false, default: -50
      t.integer :ceiling, null: false, default: 1000
      t.timestamps
    end

    create_table :semos_transactions do |t|
      t.references :from_wallet, null: false, foreign_key: { to_table: :wallets }
      t.references :to_wallet, null: false, foreign_key: { to_table: :wallets }
      t.integer :amount, null: false
      t.text :description, null: false, default: ""
      t.string :transaction_type, null: false, default: "transfer"
      t.timestamps
    end

    create_table :semos_emissions do |t|
      t.references :wallet, null: false, foreign_key: true
      t.integer :amount, null: false
      t.string :reason, null: false
      t.text :description, null: false, default: ""
      t.references :created_by, foreign_key: { to_table: :members }
      t.timestamps
    end

    create_table :semos_rates do |t|
      t.string :rate_type, null: false
      t.integer :amount, null: false
      t.text :description, null: false, default: ""
      t.timestamps
    end
    add_index :semos_rates, :rate_type, unique: true

    create_table :timesheets do |t|
      t.references :member, null: false, foreign_key: true
      t.date :date, null: false
      t.decimal :hours, precision: 5, scale: 2, null: false
      t.string :payment_type, null: false
      t.text :description, null: false, default: ""
      t.string :category, null: false
      t.boolean :invoiced, null: false, default: false
      t.decimal :kilometers, precision: 8, scale: 2, null: false, default: 0
      t.string :project_id
      t.string :course_id
      t.references :guild, foreign_key: true
      t.timestamps
    end
  end
end
