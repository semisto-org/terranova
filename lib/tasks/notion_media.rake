namespace :notion do
  desc "Download all Notion media files to Active Storage (re-fetches fresh URLs)"
  task download_media: :environment do
    downloader = NotionMediaDownloader.new(logger: Logger.new($stdout))

    # Databases with known file properties
    databases = {
      "Dépenses" => "74875c4c-cde2-4068-b2e2-a2e4cdd62efc",
      "Documents" => "e5a7c104-076a-4dd7-b373-e01636630cc1",
      "Formations" => "94dd7ee2-b0a8-4ced-8a1b-c9d2a69bdb8a",
      "Designs" => "af042ca6-8f56-4ed9-b19a-d16e5b3ccc01",
      "Contacts" => "0a7b84b1-c44f-4478-a1f2-58f7e2c7870d",
      "Espèces" => "43e8af73-f5a4-49a3-b9b6-a8de5eccd5a1",
      "Lieux" => "bd96df76-a116-4e87-a0d6-1f4fac4e19b1",
      "Offres" => "1a0ad42e-4164-48cc-a8da-fa6c0701df4e",
      "Ressources" => "95c21630-7ee8-42e0-9d6c-b5bcbe713ae0",
      "Post-its" => "7cd57a4c-dfc6-4826-bfa5-c0f1cdf12dd5",
      "Notes" => "3ca44c70-0ecb-4c53-96ea-b7c19fcd5322",
    }

    total_stats = { downloaded: 0, skipped: 0, errors: 0 }

    databases.each do |name, db_id|
      puts "\n📦 Processing #{name}..."
      stats = downloader.download_for_database(db_id, name)
      total_stats[:downloaded] += stats[:downloaded]
      total_stats[:skipped] += stats[:skipped]
      total_stats[:errors] += stats[:errors]
    end

    puts "\n📊 Total: #{total_stats[:downloaded]} downloaded, #{total_stats[:skipped]} skipped, #{total_stats[:errors]} errors"
  end

  desc "Download media for a specific database (e.g. rake notion:download_media_for[Dépenses])"
  task :download_media_for, [:database_name] => :environment do |_t, args|
    databases = {
      "Dépenses" => "74875c4c-cde2-4068-b2e2-a2e4cdd62efc",
      "Documents" => "e5a7c104-076a-4dd7-b373-e01636630cc1",
      "Formations" => "94dd7ee2-b0a8-4ced-8a1b-c9d2a69bdb8a",
      "Designs" => "af042ca6-8f56-4ed9-b19a-d16e5b3ccc01",
      "Contacts" => "0a7b84b1-c44f-4478-a1f2-58f7e2c7870d",
      "Espèces" => "43e8af73-f5a4-49a3-b9b6-a8de5eccd5a1",
      "Offres" => "1a0ad42e-4164-48cc-a8da-fa6c0701df4e",
    }

    name = args[:database_name]
    db_id = databases[name]
    abort "Unknown database: #{name}. Known: #{databases.keys.join(', ')}" unless db_id

    downloader = NotionMediaDownloader.new(logger: Logger.new($stdout))
    downloader.download_for_database(db_id, name)
  end
end
