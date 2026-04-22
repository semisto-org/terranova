class AddCashAccountsAndStripeSupport < ActiveRecord::Migration[8.1]
  def up
    # --- BankConnection extensions ---
    add_column :bank_connections, :is_virtual, :boolean, default: false, null: false
    add_index :bank_connections, :provider

    # Unique cash account per organization (when is_virtual=true)
    add_index :bank_connections, :organization_id,
              unique: true,
              where: "provider = 'cash'",
              name: "index_bank_connections_on_cash_per_org"

    # --- Revenue: Stripe payment intent idempotency key ---
    add_column :revenues, :stripe_payment_intent_id, :string
    add_index :revenues, :stripe_payment_intent_id, unique: true, where: "stripe_payment_intent_id IS NOT NULL"

    # --- Backfill: create cash BankConnection for each existing Organization ---
    execute <<~SQL
      INSERT INTO bank_connections (
        provider, bank_name, status, accounting_scope, organization_id, is_virtual,
        connected_by_id, created_at, updated_at
      )
      SELECT
        'cash',
        'Caisse',
        'linked',
        'general',
        o.id,
        true,
        (SELECT id FROM members WHERE is_admin = true ORDER BY id LIMIT 1),
        NOW(),
        NOW()
      FROM organizations o
      WHERE NOT EXISTS (
        SELECT 1 FROM bank_connections bc
        WHERE bc.organization_id = o.id AND bc.provider = 'cash'
      )
    SQL
  end

  def down
    execute "DELETE FROM bank_connections WHERE provider = 'cash'"
    remove_index :revenues, column: :stripe_payment_intent_id
    remove_column :revenues, :stripe_payment_intent_id
    remove_index :bank_connections, name: "index_bank_connections_on_cash_per_org"
    remove_index :bank_connections, :provider
    remove_column :bank_connections, :is_virtual
  end
end
