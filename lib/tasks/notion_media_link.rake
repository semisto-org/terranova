namespace :notion do
  desc "Link downloaded NotionAssets to their corresponding models"
  task link_media: :environment do
    linked = 0
    errors = 0

    # Link expense invoices (property: "Documents" or "Document")
    puts "📎 Linking expense invoices..."
    NotionAsset.where(property_name: ["Documents", "Document", "PDF"]).find_each do |asset|
      expense = Expense.find_by(notion_id: asset.source_id)
      next unless expense && asset.file.attached?

      unless expense.document.attached?
        expense.document.attach(asset.file.blob)
        linked += 1
        puts "  ✅ Expense ##{expense.id}: #{asset.filename}"
      end
    rescue => e
      errors += 1
      puts "  ❌ Error linking expense #{asset.source_id}: #{e.message}"
    end

    # Link organisation logos
    puts "📎 Linking organisation logos..."
    NotionAsset.where(property_name: "Logo").find_each do |asset|
      contact = Contact.find_by(notion_id: asset.source_id)
      next unless contact && asset.file.attached?

      asset.update(attachable: contact) unless asset.attachable
      linked += 1
    rescue => e
      errors += 1
    end

    # Link training photos (Trombinoscope)
    puts "📎 Linking training photos..."
    NotionAsset.where(property_name: "Trombinoscope").find_each do |asset|
      training = Academy::Training.find_by(notion_id: asset.source_id)
      next unless training && asset.file.attached?

      asset.update(attachable: training) unless asset.attachable
      linked += 1
    rescue => e
      errors += 1
    end

    # Link plant record photos
    puts "📎 Linking plant record photos..."
    NotionAsset.where(property_name: ["Photos", "Fleurs"]).find_each do |asset|
      plant_record = PlantRecord.find_by(notion_id: asset.source_id)
      next unless plant_record && asset.file.attached?

      asset.update(attachable: plant_record) unless asset.attachable
      linked += 1
    rescue => e
      errors += 1
    end

    puts "\n📊 Linked: #{linked}, Errors: #{errors}"
  end
end
