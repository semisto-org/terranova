# frozen_string_literal: true

namespace :notion do
  desc "Crawl all accessible Notion databases and upsert every page as a NotionRecord"
  task crawl_all: :environment do
    importer = NotionImporter.new

    puts "🔍 Searching for all accessible Notion databases..."

    databases = []
    cursor = nil

    loop do
      body = { filter: { value: "database", property: "object" }, page_size: 100 }
      body[:start_cursor] = cursor if cursor

      response = importer.send(:api_post, "/search", body)
      databases.concat(response["results"])

      break unless response["has_more"]
      cursor = response["next_cursor"]
    end

    puts "📚 Found #{databases.length} databases"

    total_pages = 0
    total_created = 0
    total_updated = 0
    total_errors = 0

    databases.each_with_index do |db, db_index|
      db_id = db["id"]
      db_title = db.dig("title")&.map { |t| t["plain_text"] }&.join || db_id
      puts "\n📁 [#{db_index + 1}/#{databases.length}] #{db_title} (#{db_id})"

      pages = importer.fetch_database(db_id)
      created = 0
      updated = 0
      errors = 0

      pages.each_with_index do |page, page_index|
        notion_id = page["id"]

        begin
          # Extract title from properties
          title = importer.extract(page["properties"], "Name") ||
                  importer.extract(page["properties"], "Nom") ||
                  importer.extract(page["properties"], "Titre") ||
                  ""

          # Fetch content blocks and convert to HTML
          blocks, html = importer.fetch_and_convert_page_content(notion_id)

          # Upsert NotionRecord
          record = NotionRecord.find_or_initialize_by(notion_id: notion_id)
          is_new = record.new_record?

          record.assign_attributes(
            database_name: db_title,
            database_id: db_id,
            title: title,
            properties: page["properties"],
            content: blocks&.to_json,
            content_html: html
          )
          record.save!

          is_new ? created += 1 : updated += 1
          print "." if (page_index + 1) % 10 == 0
        rescue => e
          errors += 1
          puts "\n  ❌ Page #{notion_id}: #{e.message}"
        end

        sleep 0.3
      end

      puts "\n  ✅ #{pages.length} pages: #{created} created, #{updated} updated, #{errors} errors"

      total_pages += pages.length
      total_created += created
      total_updated += updated
      total_errors += errors
    end

    puts "\n🏁 Crawl complete!"
    puts "   #{databases.length} databases, #{total_pages} pages"
    puts "   #{total_created} created, #{total_updated} updated, #{total_errors} errors"
  end
end
