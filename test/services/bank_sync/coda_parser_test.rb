# frozen_string_literal: true

require "test_helper"

class BankSync::CodaParserTest < ActiveSupport::TestCase
  setup do
    @parser = BankSync::CodaParser.new
  end

  # Helper to build a minimal valid CODA file from lines
  def build_coda(*lines)
    lines.map { |l| l.ljust(128) }.join("\n")
  end

  def sample_header_line
    "0000018032600105        00000000   Semisto ASBL              BBRUBEBB   00932942  00000                                         2"
  end

  def sample_old_balance_line
    "10000BE52523080001234 EUR0000000012345670260301          Semisto ASBL              000                                        0"
  end

  def sample_movement_line1
    "2100010000BANKREF00000000000001000000000001500000260315008010000101123456781234500012                                   260315 0"
  end

  def sample_movement_line2
    "2200010000                                                          VDSPBE22   BE98651100005678          00000000000000000     0"
  end

  def sample_movement_line3
    "2300010000Pépinière du Soleil                   Communication libre test                         0 00000000000150000260315     0"
  end

  def sample_new_balance_line
    "8000BE52523080001234 EUR0000000013845670260315                                                                                0"
  end

  def sample_trailer_line
    "9               000003000000000015000000000000000001500000                                                                    2"
  end

  def full_sample_coda
    build_coda(
      sample_header_line,
      sample_old_balance_line,
      sample_movement_line1,
      sample_movement_line2,
      sample_movement_line3,
      sample_new_balance_line,
      sample_trailer_line
    )
  end

  test "raises ParseError for empty content" do
    assert_raises(BankSync::CodaParser::ParseError) { @parser.parse("") }
  end

  test "raises ParseError for non-CODA content" do
    assert_raises(BankSync::CodaParser::ParseError) { @parser.parse("This is not a CODA file") }
  end

  test "parses header record" do
    result = @parser.parse(full_sample_coda)
    assert_not_nil result.bank_id
    assert_not_nil result.account_holder
    assert_not_nil result.file_date
  end

  test "parses old balance" do
    result = @parser.parse(full_sample_coda)
    assert_not_nil result.old_balance
    assert result.old_balance.is_a?(BigDecimal)
    assert_not_nil result.old_balance_date
    assert_equal :credit, result.old_balance_sign
  end

  test "parses account number" do
    result = @parser.parse(full_sample_coda)
    assert_not_nil result.account_number
  end

  test "parses movements" do
    result = @parser.parse(full_sample_coda)
    assert_equal 1, result.movements.size

    movement = result.movements.first
    assert_not_nil movement.sequence
    assert_not_nil movement.bank_reference
    assert_not_nil movement.amount
    assert movement.amount.is_a?(BigDecimal)
    assert_includes [:credit, :debit], movement.sign
    assert_not_nil movement.value_date
    assert movement.value_date.is_a?(Date)
  end

  test "parses movement counterpart info from line 2 and 3" do
    result = @parser.parse(full_sample_coda)
    movement = result.movements.first

    assert_equal "Pépinière du Soleil", movement.counterpart_name
    assert_not_nil movement.counterpart_account
  end

  test "parses new balance" do
    result = @parser.parse(full_sample_coda)
    assert_not_nil result.new_balance
    assert result.new_balance.is_a?(BigDecimal)
    assert_not_nil result.new_balance_date
  end

  test "parse_amount converts CODA amount format correctly" do
    parser = BankSync::CodaParser.new
    # Use send to test private method
    assert_equal BigDecimal("150.000"), parser.send(:parse_amount, "000000000150000")
    assert_equal BigDecimal("0"), parser.send(:parse_amount, "000000000000000")
    assert_equal BigDecimal("12345.670"), parser.send(:parse_amount, "000000012345670")
    assert_equal BigDecimal("0"), parser.send(:parse_amount, "")
  end

  test "parse_date converts DDMMYY format" do
    parser = BankSync::CodaParser.new
    assert_equal Date.new(2026, 3, 15), parser.send(:parse_date, "150326")
    assert_nil parser.send(:parse_date, "000000")
    assert_nil parser.send(:parse_date, "")
  end

  test "extract_communication handles structured communications" do
    parser = BankSync::CodaParser.new
    # Structured (Belgian +++NNN/NNNN/NNNNN+++ format)
    result = parser.send(:extract_communication, "101123456781234500012")
    assert result.start_with?("+++")
    assert result.end_with?("+++")

    # Free-form
    result = parser.send(:extract_communication, "Paiement facture 2026-001")
    assert_equal "Paiement facture 2026-001", result
  end

  test "handles multiple movements in one file" do
    line1a = "2100010000BANKREF00000000000001000000000001500000260315008010000101123456781234500012                                   260315 0"
    line2a = "2200010000                                                          VDSPBE22   BE98651100005678          00000000000000000     0"
    line3a = "2300010000Supplier One                             Communication one                                    0 00000000000150000260315     0"

    line1b = "2100020000BANKREF00000000000001100000000002000000260316008010000Paiement services                                      260316 0"
    line2b = "2200020000                                                          BBRUBEBB   BE12345678901234          00000000000000000     0"
    line3b = "2300020000Supplier Two                             Communication two                                    0 00000000000200000260316     0"

    content = build_coda(
      sample_header_line,
      sample_old_balance_line,
      line1a, line2a, line3a,
      line1b, line2b, line3b,
      sample_new_balance_line,
      sample_trailer_line
    )

    result = @parser.parse(content)
    assert_equal 2, result.movements.size
    assert_equal "Supplier One", result.movements[0].counterpart_name
    assert_equal "Supplier Two", result.movements[1].counterpart_name
  end

  test "handles credit and debit signs correctly" do
    # Sign at position 31: '0' = credit, '1' = debit
    credit_line = "2100010000BANKREF00000000000001000000000001500000260315008010000Communication test                                      260315 0"
    debit_line  = "2100010000BANKREF00000000000002001000000001500000260315008010000Communication test                                      260315 0"

    credit_content = build_coda(sample_header_line, sample_old_balance_line, credit_line, sample_new_balance_line, sample_trailer_line)
    debit_content = build_coda(sample_header_line, sample_old_balance_line, debit_line, sample_new_balance_line, sample_trailer_line)

    credit_result = @parser.parse(credit_content)
    assert_equal :credit, credit_result.movements.first.sign

    debit_result = @parser.parse(debit_content)
    assert_equal :debit, debit_result.movements.first.sign
  end

  test "skips information records (type 3)" do
    info_line = "3100010000Extra information about the movement that should be skipped by the parser                                            0"

    content = build_coda(
      sample_header_line,
      sample_old_balance_line,
      sample_movement_line1,
      sample_movement_line2,
      sample_movement_line3,
      info_line,
      sample_new_balance_line,
      sample_trailer_line
    )

    result = @parser.parse(content)
    assert_equal 1, result.movements.size
  end

  test "handles blank lines in content" do
    content = full_sample_coda + "\n\n\n"
    result = @parser.parse(content)
    assert_equal 1, result.movements.size
  end
end
