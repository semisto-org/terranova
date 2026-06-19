# frozen_string_literal: true

module BankSync
  # Parses Belgian CODA (Coded Statement of Account) bank statement files.
  # CODA is a fixed-width format (128 chars/line) used by all Belgian banks.
  #
  # Returns a structured hash with header, old_balance, movements, new_balance.
  class CodaParser
    class ParseError < StandardError; end

    Movement = Struct.new(
      :sequence, :bank_reference, :amount, :sign,
      :value_date, :booking_date, :transaction_code,
      :communication, :counterpart_name, :counterpart_account,
      :counterpart_bic, keyword_init: true
    )

    Result = Struct.new(
      :bank_id, :account_holder, :account_number,
      :old_balance, :old_balance_date, :old_balance_sign,
      :new_balance, :new_balance_date, :new_balance_sign,
      :movements, :file_date, keyword_init: true
    )

    def parse(content)
      lines = content.encode("UTF-8", invalid: :replace, undef: :replace, replace: "?")
                     .lines.map(&:chomp)

      raise ParseError, "Fichier vide" if lines.empty?
      raise ParseError, "Format CODA invalide : la première ligne doit commencer par 0" unless lines.first.start_with?("0")

      result = Result.new(movements: [])
      current_movement = nil

      lines.each_with_index do |line, idx|
        next if line.strip.empty?

        record_type = line[0]

        case record_type
        when "0"
          parse_header(line, result)
        when "1"
          parse_old_balance(line, result)
        when "2"
          detail_type = line[1]
          case detail_type
          when "1"
            # A new movement starts: flush the previous one. Lines 22/23 are
            # optional, so a movement may consist of a 21 line only — it must
            # still be captured rather than overwritten by the next 21.
            result.movements << current_movement if current_movement
            current_movement = parse_movement_line1(line)
          when "2"
            parse_movement_line2(line, current_movement) if current_movement
          when "3"
            parse_movement_line3(line, current_movement) if current_movement
          end
        when "3"
          # Information records — skip (supplementary details)
          next
        when "8"
          # End of a statement: flush the last movement before reading the balance.
          result.movements << current_movement if current_movement
          current_movement = nil
          parse_new_balance(line, result)
        when "9"
          # Trailer — skip
          next
        end
      rescue => e
        raise ParseError, "Erreur ligne #{idx + 1}: #{e.message}"
      end

      # If last movement wasn't closed by a type 23 line, add it
      result.movements << current_movement if current_movement

      result
    end

    private

    def parse_header(line, result)
      result.file_date = parse_date(line[24, 6])
      result.bank_id = line[5, 5].strip
      result.account_holder = line[28, 26].strip
    end

    def parse_old_balance(line, result)
      result.account_number = extract_account_number(line[5, 37])
      sign, amount, date = parse_balance_fields(line)
      result.old_balance_sign = sign
      result.old_balance = amount
      result.old_balance_date = date
    end

    def parse_movement_line1(line)
      sign = line[31] == "0" ? :credit : :debit
      amount = parse_amount(line[32, 15])

      Movement.new(
        sequence: line[2, 4].strip,
        bank_reference: line[10, 21].strip,
        sign: sign,
        amount: amount,
        value_date: parse_date(line[47, 6]),
        booking_date: parse_date(line[115, 6]),
        transaction_code: line[53, 8].strip,
        communication: extract_communication(line[61, 53]),
        counterpart_name: nil,
        counterpart_account: nil,
        counterpart_bic: nil
      )
    end

    def parse_movement_line2(line, movement)
      # Communication continued
      comm_cont = line[10, 53].strip
      movement.communication = [movement.communication, comm_cont].compact_blank.join(" ")

      # Counterpart account (IBAN or Belgian format)
      counterpart = line[97, 26].strip
      movement.counterpart_account = counterpart if counterpart.present?

      # BIC
      bic = line[75, 11].strip
      movement.counterpart_bic = bic if bic.present?
    end

    def parse_movement_line3(line, movement)
      # Counterpart name
      name = line[10, 35].strip
      movement.counterpart_name = name if name.present?

      # Communication continued
      comm_cont = line[45, 43].strip
      if comm_cont.present?
        movement.communication = [movement.communication, comm_cont].compact_blank.join(" ")
      end
    end

    def parse_new_balance(line, result)
      sign, amount, date = parse_balance_fields(line)
      result.new_balance_sign = sign
      result.new_balance = amount
      result.new_balance_date = date
    end

    # The balance records (type 1 = old, type 8 = new) hold a 1-char sign,
    # a 15-digit amount and a 6-digit date. Triodos shifts the old-balance
    # record one position to the right versus the spec/new-balance record, so
    # anchor on the sign column ("0" credit / "1" debit) to locate the fields
    # rather than hardcoding an offset.
    def parse_balance_fields(line)
      offset = %w[0 1].include?(line[41]) ? 41 : 42
      sign = line[offset] == "0" ? :credit : :debit
      amount = parse_amount(line[offset + 1, 15])
      date = parse_date(line[offset + 16, 6])
      [sign, amount, date]
    end

    def parse_amount(raw)
      return BigDecimal("0") if raw.blank?
      # CODA amounts: 15 digits, last 3 are decimals
      cleaned = raw.strip.gsub(/\D/, "")
      return BigDecimal("0") if cleaned.empty?
      BigDecimal(cleaned) / 1000
    end

    def parse_date(raw)
      return nil if raw.blank? || raw.strip == "000000"
      day = raw[0, 2]
      month = raw[2, 2]
      year = raw[4, 2]
      full_year = year.to_i > 50 ? "19#{year}" : "20#{year}"
      Date.new(full_year.to_i, month.to_i, day.to_i)
    rescue Date::Error
      nil
    end

    def extract_account_number(raw)
      cleaned = raw.strip
      # Try to find IBAN pattern (BExx xxxx xxxx xxxx)
      if cleaned =~ /([A-Z]{2}\d{14,16})/
        $1
      else
        cleaned.gsub(/\s+/, "")
      end
    end

    def extract_communication(raw)
      return nil if raw.blank?
      text = raw.strip
      # Structured communication: starts with 101 or 100
      if text.start_with?("101") || text.start_with?("100")
        # Belgian structured communication: +++NNN/NNNN/NNNNN+++
        digits = text[3..].gsub(/\D/, "")
        if digits.length >= 12
          "+++#{digits[0, 3]}/#{digits[3, 4]}/#{digits[7, 5]}+++"
        else
          text
        end
      else
        text
      end
    end
  end
end
