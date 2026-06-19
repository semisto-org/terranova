# frozen_string_literal: true

# One-off production migration: re-key existing CODA-imported transactions to the
# new deduplication-id scheme introduced in fix/coda-blank-bank-reference, WITHOUT
# losing reconciliations, then create the movements that the old buggy importer
# silently dropped.
#
# WHY
# ---
# The old importer keyed transactions on `coda_<conn>_<bank_reference>_<date>`.
# Triodos leaves bank_reference blank, so every same-day movement collapsed onto
# one id and ~54% of movements were skipped as "duplicates". The new importer
# keys on `coda_<conn>_<sequence>_<date>_<signed_amount>`. The new ids do not
# match the old ones, so a plain re-import would DUPLICATE the transactions that
# already exist (and their reconciliations would stay attached to the old rows).
#
# The CODA sequence number is not stored on BankTransaction, so the old id cannot
# be recomputed from the row alone. This script therefore re-parses the original
# CODA file(s) — which DO carry the sequence — and matches each existing
# transaction to its movement by content (date + signed amount + communication),
# then rewrites its provider_transaction_id to the new scheme via update_column
# (no callbacks, reconciliations preserved). Movements with no existing match are
# created by a normal re-import afterwards.
#
# USAGE
# -----
#   # dry-run (default): reports what would change, writes nothing
#   bin/rails runner script/migrate_coda_transaction_ids.rb <connection_id> <coda_file> [<coda_file>...]
#
#   # apply
#   APPLY=1 bin/rails runner script/migrate_coda_transaction_ids.rb <connection_id> <coda_file> [...]
#
#   # apply even if some existing rows could not be matched (NOT recommended —
#   # unmatched rows that stay on the old id will be duplicated by the re-import)
#   APPLY=1 FORCE=1 bin/rails runner script/migrate_coda_transaction_ids.rb <connection_id> <coda_file> [...]
#
# The script is idempotent: a second run finds every row already on the new id,
# remaps nothing, and imports nothing.

apply = ENV["APPLY"] == "1"
force = ENV["FORCE"] == "1"

connection_id = ARGV[0]
files = ARGV[1..] || []

abort "usage: migrate_coda_transaction_ids.rb <connection_id> <coda_file> [...]" if connection_id.blank? || files.empty?

connection = BankConnection.find(connection_id)
importer = BankSync::CodaImporter.new(connection)
parser = BankSync::CodaParser.new

missing = files.reject { |f| File.exist?(f) }
abort "fichier(s) introuvable(s): #{missing.join(', ')}" if missing.any?

puts "Connexion ##{connection.id} (#{connection.provider}, #{connection.iban})"
puts "Mode: #{apply ? 'APPLY (écriture)' : 'DRY-RUN (lecture seule)'}#{force ? ' FORCE' : ''}"
puts "Fichiers: #{files.join(', ')}"
puts

# Parse every file into a flat list of movements (each carries its sequence).
movements = files.flat_map { |f| parser.parse(File.read(f)).movements }
puts "Mouvements dans le(s) fichier(s): #{movements.size}"

# Pre-compute the canonical new id for each movement using the importer's own
# private builder — single source of truth, immune to drift.
movement_new_id = movements.to_h { |m| [m, importer.send(:build_transaction_id, m)] }

signed = ->(m) { m.sign == :credit ? m.amount : -m.amount }
mov_date = ->(m) { m.value_date || m.booking_date }

# Only touch rows this importer owns.
existing = connection.bank_transactions.where("provider_transaction_id LIKE ?", "coda_#{connection.id}_%").to_a
puts "Transactions CODA existantes en base: #{existing.size}"
puts

claimed = {} # movement => true
to_remap = [] # [tx, new_id]
already_ok = 0
unmatched = []

existing.each do |tx|
  candidates = movements.select do |m|
    !claimed[m] && mov_date.call(m) == tx.date && signed.call(m) == tx.amount
  end

  # Disambiguate by communication when several movements share date + amount.
  if candidates.size > 1
    by_comm = candidates.select { |m| m.communication.to_s.strip == tx.remittance_info.to_s.strip }
    candidates = by_comm if by_comm.any?
  end

  movement = candidates.first
  if movement.nil?
    unmatched << tx
    next
  end

  claimed[movement] = true
  new_id = movement_new_id[movement]
  if tx.provider_transaction_id == new_id
    already_ok += 1
  else
    to_remap << [tx, new_id]
  end
end

puts "À ré-encoder (ID réécrit) : #{to_remap.size}"
puts "Déjà au bon format        : #{already_ok}"
puts "Existantes NON matchées   : #{unmatched.size}"
unmatched.first(10).each do |tx|
  puts "  ⚠️  ##{tx.id} #{tx.date} #{tx.amount} € #{tx.remittance_info.to_s[0, 40].inspect} (status=#{tx.status})"
end
puts "  … (#{unmatched.size - 10} de plus)" if unmatched.size > 10

would_create = movements.size - (to_remap.size + already_ok)
puts
puts "Après réimport, mouvements à créer (manquants) : #{would_create}"
puts "Total attendu en base après migration          : #{existing.size - unmatched.size + would_create + (unmatched.size)}"
puts "  (dont #{unmatched.size} non matchées laissées en l'état)" if unmatched.any?
puts

if unmatched.any? && !force
  puts "⛔ #{unmatched.size} transaction(s) existante(s) n'ont pas pu être matchées à un mouvement du fichier."
  puts "   Les réimporter créerait des doublons. Vérifie que tu fournis bien le(s) bon(s) fichier(s) CODA"
  puts "   couvrant toute la période. Pour forcer malgré tout : FORCE=1 (déconseillé)."
  abort unless apply == false # in dry-run we still want to show the plan, just don't proceed to write
end

unless apply
  puts "DRY-RUN — aucune écriture. Relance avec APPLY=1 pour appliquer."
  return
end

if unmatched.any? && !force
  abort "Abandon: transactions non matchées (voir ci-dessus). FORCE=1 pour outrepasser."
end

ActiveRecord::Base.transaction do
  to_remap.each { |tx, new_id| tx.update_column(:provider_transaction_id, new_id) }
  puts "✅ #{to_remap.size} ID réécrits (rapprochements préservés)."

  total_imported = 0
  total_skipped = 0
  files.each do |f|
    res = BankSync::CodaImporter.new(connection).import(File.read(f))
    total_imported += res[:imported]
    total_skipped += res[:skipped]
  end
  puts "✅ Réimport: #{total_imported} créées, #{total_skipped} ignorées (déjà présentes)."
end

connection.reload
puts
puts "Total transactions CODA en base maintenant: #{connection.bank_transactions.where('provider_transaction_id LIKE ?', "coda_#{connection.id}_%").count}"
