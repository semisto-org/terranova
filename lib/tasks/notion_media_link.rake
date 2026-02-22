namespace :notion do
  desc "Link downloaded NotionAssets to their corresponding models"
  task link_media: :environment do
    linked = 0
    errors = 0

    # Link expense invoices
    puts "📎 Linking expense invoices..."
    NotionAsset.where(property_name: ["Facture", "Invoice", "Document", "Fichier"]).find_each do |asset|
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

    # Link design project documents
    puts "📎 Linking design documents..."
    NotionAsset.where(property_name: ["Fichier", "File", "Document"]).find_each do |asset|
      doc = Design::ProjectDocument.find_by(notion_id: asset.source_id)
      next unless doc && asset.file.attached?

      asset.update(attachable: doc) unless asset.attachable
      linked += 1
    rescue => e
      errors += 1
      puts "  ❌ Error: #{e.message}"
    end

    # Link training documents
    puts "📎 Linking training documents..."
    NotionAsset.where(source_type: "property").find_each do |asset|
      training = Academy::Training.find_by(notion_id: asset.source_id)
      next unless training && asset.file.attached?

      asset.update(attachable: training) unless asset.attachable
      linked += 1
    rescue => e
      errors += 1
    end

    puts "\n📊 Linked: #{linked}, Errors: #{errors}"
  end
end
