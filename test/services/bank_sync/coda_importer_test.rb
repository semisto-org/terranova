# frozen_string_literal: true

require "test_helper"

class BankSync::CodaImporterTest < ActiveSupport::TestCase
  setup do
    BankReconciliation.delete_all
    BankTransaction.delete_all
    BankConnection.delete_all

    @admin = Member.find_or_create_by!(email: "admin@test.local") do |m|
      m.first_name = "Admin"
      m.last_name = "Test"
      m.password = "password123"
      m.is_admin = true
    end

    @connection = BankConnection.create!(
      provider: "coda_import",
      bank_name: "Triodos",
      iban: "BE52523080001234",
      status: "linked",
      accounting_scope: "general",
      connected_by: @admin
    )
  end

  def build_coda(*lines)
    lines.map { |l| l.ljust(128) }.join("\n")
  end

  def sample_coda_content
    header    = "0000018032600105        00000000   Semisto ASBL              BBRUBEBB   00932942  00000                                         2"
    old_bal   = "10000BE52523080001234 EUR0000000012345670260301          Semisto ASBL              000                                        0"
    line1     = "2100010000BANKREF00000000000001000000000001500000260315008010000101123456781234500012                                   260315 0"
    line2     = "2200010000                                                          VDSPBE22   BE98651100005678          00000000000000000     0"
    line3     = "2300010000Pépinière du Soleil                   Communication libre test                         0 00000000000150000260315     0"
    new_bal   = "8000BE52523080001234 EUR0000000013845670260315                                                                                0"
    trailer   = "9               000003000000000015000000000000000001500000                                                                    2"

    build_coda(header, old_bal, line1, line2, line3, new_bal, trailer)
  end

  def two_movement_coda
    header  = "0000018032600105        00000000   Semisto ASBL              BBRUBEBB   00932942  00000                                         2"
    old_bal = "10000BE52523080001234 EUR0000000012345670260301          Semisto ASBL              000                                        0"

    line1a  = "2100010000BANKREF00000000000001000000000001500000260315008010000Communication one                                      260315 0"
    line2a  = "2200010000                                                          VDSPBE22   BE98651100005678          00000000000000000     0"
    line3a  = "2300010000Supplier One                             Comm detail                                          0 00000000000150000260315     0"

    line1b  = "2100020000BANKREF00000000000002010000000002500000260316008010000Communication two                                      260316 0"
    line2b  = "2200020000                                                          BBRUBEBB   BE12345678901234          00000000000000000     0"
    line3b  = "2300020000Supplier Two                             Comm detail two                                      0 00000000000250000260316     0"

    new_bal = "8000BE52523080001234 EUR0000000013345670260316                                                                                0"
    trailer = "9               000006000000000040000000000000000001000000                                                                    2"

    build_coda(header, old_bal, line1a, line2a, line3a, line1b, line2b, line3b, new_bal, trailer)
  end

  test "imports movements from CODA content" do
    importer = BankSync::CodaImporter.new(@connection)
    result = importer.import(sample_coda_content)

    assert_equal 1, result[:imported]
    assert_equal 0, result[:skipped]
    assert_equal 1, result[:movements_total]

    assert_equal 1, @connection.bank_transactions.count
    tx = @connection.bank_transactions.first
    assert_equal "EUR", tx.currency
    assert_equal "unmatched", tx.status
    assert_equal "Pépinière du Soleil", tx.counterpart_name
    assert_not_nil tx.internal_reference
  end

  test "sets signed amount correctly for credits and debits" do
    importer = BankSync::CodaImporter.new(@connection)
    importer.import(two_movement_coda)

    txs = @connection.bank_transactions.order(:date)
    # First movement: sign at position 31 is '0' = credit → positive amount
    assert txs.first.amount > 0
    # Second movement: sign at position 31 is '1' = debit → negative amount
    assert txs.second.amount < 0
  end

  test "deduplicates on provider_transaction_id" do
    importer1 = BankSync::CodaImporter.new(@connection)
    result1 = importer1.import(sample_coda_content)
    assert_equal 1, result1[:imported]
    assert_equal 0, result1[:skipped]

    # Import same content again
    importer2 = BankSync::CodaImporter.new(@connection)
    result2 = importer2.import(sample_coda_content)
    assert_equal 0, result2[:imported]
    assert_equal 1, result2[:skipped]

    # Still only 1 transaction in DB
    assert_equal 1, @connection.bank_transactions.count
  end

  test "updates last_synced_at on connection" do
    assert_nil @connection.last_synced_at

    importer = BankSync::CodaImporter.new(@connection)
    importer.import(sample_coda_content)

    @connection.reload
    assert_not_nil @connection.last_synced_at
    assert @connection.last_synced_at > 1.minute.ago
  end

  test "imports multiple movements in one file" do
    importer = BankSync::CodaImporter.new(@connection)
    result = importer.import(two_movement_coda)

    assert_equal 2, result[:imported]
    assert_equal 0, result[:skipped]
    assert_equal 2, result[:movements_total]
    assert_equal 2, @connection.bank_transactions.count
  end

  test "raises ParseError for invalid CODA content" do
    importer = BankSync::CodaImporter.new(@connection)
    assert_raises(BankSync::CodaParser::ParseError) do
      importer.import("not a valid coda file")
    end
  end

  test "transaction_ids are scoped to connection" do
    other_connection = BankConnection.create!(
      provider: "coda_import",
      bank_name: "VDK",
      iban: "BE98651100005678",
      status: "linked",
      accounting_scope: "nursery",
      connected_by: @admin
    )

    importer1 = BankSync::CodaImporter.new(@connection)
    importer1.import(sample_coda_content)

    # Same CODA content imported to a different connection creates new transactions
    # because the transaction_id includes the connection_id
    importer2 = BankSync::CodaImporter.new(other_connection)
    result = importer2.import(sample_coda_content)
    assert_equal 1, result[:imported]

    assert_equal 1, @connection.bank_transactions.count
    assert_equal 1, other_connection.bank_transactions.count
  end
end
