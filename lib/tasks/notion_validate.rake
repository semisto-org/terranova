# frozen_string_literal: true

namespace :notion do
  desc "Validate Notion migration: compare NotionRecord counts with Terranova models"
  task validate: :environment do
    puts "=" * 70
    puts "📊 NOTION MIGRATION VALIDATION REPORT"
    puts "=" * 70
    puts ""

    # Define mapping: [database_name, model_class, label]
    mappings = [
      ["Contacts",                  Contact,                          "Contacts (persons)"],
      ["Entreprises et collectifs", Contact,                          "Organizations"],
      ["Fournisseurs",              Contact,                          "Suppliers"],
      ["Lieux",                     Academy::TrainingLocation,        "Locations"],
      ["Formations",                Academy::Training,                "Trainings"],
      ["Inscriptions",              Academy::TrainingRegistration,    "Registrations"],
      ["Revenus",                   Revenue,                          "Revenues"],
      ["Dépenses",                  Expense,                          "Expenses"],
    ]

    total_orphans = 0

    mappings.each do |db_name, model_class, label|
      notion_records = NotionRecord.where(database_name: db_name)
      notion_count = notion_records.count

      # Get all notion_ids from the model
      model_notion_ids = model_class.where.not(notion_id: [nil, ""]).pluck(:notion_id).map(&:to_s).to_set
      model_count = model_class.count

      # Find orphans: in NotionRecord but not in the model
      notion_ids_in_nr = notion_records.pluck(:notion_id).map(&:to_s)
      orphan_ids = notion_ids_in_nr.reject { |nid| model_notion_ids.include?(nid) }

      total_orphans += orphan_ids.size

      puts "── #{label} ──"
      puts "  NotionRecords (#{db_name}): #{notion_count}"
      puts "  #{model_class.name} total: #{model_count}"
      if orphan_ids.any?
        puts "  ⚠️  Orphan notion_ids (in NotionRecord, missing in model): #{orphan_ids.size}"
        orphan_ids.first(5).each do |oid|
          nr = notion_records.find_by(notion_id: oid)
          puts "      - #{oid} (#{nr&.title || 'no title'})"
        end
        puts "      ... and #{orphan_ids.size - 5} more" if orphan_ids.size > 5
      else
        puts "  ✅ No orphans"
      end
      puts ""
    end

    # Unresolved relations
    puts "── Unresolved Relations ──"

    # Trainings without location but NotionRecord had a location relation
    trainings_no_loc = Academy::Training.where(location_id: nil).where.not(notion_id: [nil, ""])
    if trainings_no_loc.any?
      with_loc_relation = trainings_no_loc.select do |t|
        nr = NotionRecord.find_by(notion_id: t.notion_id, database_name: "Formations")
        next false unless nr&.properties
        props = nr.properties.is_a?(String) ? JSON.parse(nr.properties) : nr.properties
        lieu = props["Lieu"]
        lieu && lieu["type"] == "relation" && lieu["relation"].present?
      end
      if with_loc_relation.any?
        puts "  ⚠️  Trainings with location_id=nil but Notion had a location relation: #{with_loc_relation.size}"
        with_loc_relation.first(5).each { |t| puts "      - #{t.notion_id} (#{t.title})" }
      else
        puts "  ✅ All training location relations resolved"
      end
    else
      puts "  ✅ All trainings have a location (or no notion_id)"
    end

    # Revenues without contact
    revs_no_contact = Revenue.where(contact_id: nil).where.not(notion_id: [nil, ""])
    if revs_no_contact.any?
      with_client_rel = revs_no_contact.select do |r|
        nr = NotionRecord.find_by(notion_id: r.notion_id, database_name: "Revenus")
        next false unless nr&.properties
        props = nr.properties.is_a?(String) ? JSON.parse(nr.properties) : nr.properties
        client = props["Client"]
        client && client["type"] == "relation" && client["relation"].present?
      end
      if with_client_rel.any?
        puts "  ⚠️  Revenues with contact_id=nil but Notion had a Client relation: #{with_client_rel.size}"
      else
        puts "  ✅ All revenue client relations resolved"
      end
    else
      puts "  ✅ All revenues have a contact"
    end

    # Expenses without supplier_contact
    exps_no_sup = Expense.where(supplier_contact_id: nil).where.not(notion_id: [nil, ""])
    if exps_no_sup.any?
      with_sup_rel = exps_no_sup.select do |e|
        nr = NotionRecord.find_by(notion_id: e.notion_id, database_name: "Dépenses")
        next false unless nr&.properties
        props = nr.properties.is_a?(String) ? JSON.parse(nr.properties) : nr.properties
        sup = props["Fournisseur"]
        sup && sup["type"] == "relation" && sup["relation"].present?
      end
      if with_sup_rel.any?
        puts "  ⚠️  Expenses with supplier_contact_id=nil but Notion had a Fournisseur relation: #{with_sup_rel.size}"
      else
        puts "  ✅ All expense supplier relations resolved"
      end
    else
      puts "  ✅ All expenses have a supplier"
    end
    puts ""

    # Financial totals comparison
    puts "── Financial Totals ──"
    rev_total = Revenue.sum(:amount_excl_vat)
    exp_total = Expense.sum(:amount_excl_vat)
    puts "  Revenues total (amount_excl_vat): #{rev_total.to_f.round(2)} €"
    puts "  Expenses total (amount_excl_vat): #{exp_total.to_f.round(2)} €"
    puts "  Balance: #{(rev_total - exp_total).to_f.round(2)} €"
    puts ""

    puts "=" * 70
    puts total_orphans.zero? ? "✅ All good! No orphans found." : "⚠️  Total orphans across all types: #{total_orphans}"
    puts "=" * 70
  end
end
