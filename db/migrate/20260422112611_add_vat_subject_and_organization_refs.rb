class AddVatSubjectAndOrganizationRefs < ActiveRecord::Migration[8.1]
  def up
    add_column :organizations, :vat_subject, :boolean, default: true, null: false

    # Mark the nursery organization as VAT-exempt (franchise).
    # Match by name keyword "pépinière" / "pepiniere" to be resilient to label variants.
    execute <<~SQL
      UPDATE organizations
      SET vat_subject = false
      WHERE LOWER(name) LIKE '%pépinière%'
         OR LOWER(name) LIKE '%pepiniere%'
         OR LOWER(name) LIKE '%yggdrasil%'
    SQL

    add_reference :bank_connections, :organization, foreign_key: true, null: true
    add_reference :expenses, :organization, foreign_key: true, null: true
    add_reference :revenues, :organization, foreign_key: true, null: true

    # Backfill bank_connections: nursery scope → Pépinière; else → default org
    execute <<~SQL
      UPDATE bank_connections bc
      SET organization_id = (
        SELECT id FROM organizations
        WHERE vat_subject = false
        ORDER BY created_at ASC
        LIMIT 1
      )
      WHERE bc.accounting_scope = 'nursery' AND bc.organization_id IS NULL
    SQL

    execute <<~SQL
      UPDATE bank_connections bc
      SET organization_id = (
        SELECT id FROM organizations
        WHERE is_default = true
        ORDER BY created_at ASC
        LIMIT 1
      )
      WHERE bc.organization_id IS NULL
    SQL

    # Backfill expenses: via reconciled bank_transaction's connection, else default
    execute <<~SQL
      UPDATE expenses e
      SET organization_id = bc.organization_id
      FROM bank_reconciliations br
      JOIN bank_transactions bt ON bt.id = br.bank_transaction_id
      JOIN bank_connections bc ON bc.id = bt.bank_connection_id
      WHERE br.reconcilable_type = 'Expense'
        AND br.reconcilable_id = e.id
        AND e.organization_id IS NULL
        AND bc.organization_id IS NOT NULL
    SQL

    execute <<~SQL
      UPDATE expenses
      SET organization_id = (
        SELECT id FROM organizations
        WHERE is_default = true
        ORDER BY created_at ASC
        LIMIT 1
      )
      WHERE organization_id IS NULL
    SQL

    # Backfill revenues: same pattern
    execute <<~SQL
      UPDATE revenues r
      SET organization_id = bc.organization_id
      FROM bank_reconciliations br
      JOIN bank_transactions bt ON bt.id = br.bank_transaction_id
      JOIN bank_connections bc ON bc.id = bt.bank_connection_id
      WHERE br.reconcilable_type = 'Revenue'
        AND br.reconcilable_id = r.id
        AND r.organization_id IS NULL
        AND bc.organization_id IS NOT NULL
    SQL

    execute <<~SQL
      UPDATE revenues
      SET organization_id = (
        SELECT id FROM organizations
        WHERE is_default = true
        ORDER BY created_at ASC
        LIMIT 1
      )
      WHERE organization_id IS NULL
    SQL

    change_column_null :bank_connections, :organization_id, false
    change_column_null :expenses, :organization_id, false
    change_column_null :revenues, :organization_id, false
  end

  def down
    remove_reference :revenues, :organization, foreign_key: true
    remove_reference :expenses, :organization, foreign_key: true
    remove_reference :bank_connections, :organization, foreign_key: true
    remove_column :organizations, :vat_subject
  end
end
