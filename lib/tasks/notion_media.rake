namespace :notion do
  NOTION_DATABASES_WITH_FILES = {
    "Dépenses" => "74875c4c-693e-48df-8e63-0f276a272f8e",
    "Documents" => "e5a7c104-076a-4dd7-b373-e01636630cc1",
    "Formations" => "94dd7ee2-457e-452b-92bd-aeeee152c376",
    "Designs" => "af042ca6-5380-49b0-83c8-8cdbb1f5662e",
    "Contacts" => "0a7b84b1-6083-433d-b8d4-50fda24008ea",
    "Espèces" => "43e8af73-6791-4b19-adbd-e182eadd85c8",
    "Lieux" => "bd96df76-eb53-4893-b317-5d17d6cfe99e",
    "Offres" => "1a0ad42e-4164-48cc-a8da-fa6c0701df4e",
    "Ressources" => "95c21630-7ee8-42e0-9d6c-b5bcbe713ae0",
    "Post-its" => "7cd57a4c-6b5b-405f-85fb-6b7115655c45",
    "Notes" => "3ca44c70-0ecb-4c53-96ea-b7c19fcd5322",
    "Fournisseurs" => "d0dbcf84-6892-4327-946d-0ec241df0c06",
    "Entreprises" => "2af0c330-0966-45eb-bc1b-ffcf2fffec53",
    "Variétés" => "0da62621-850d-4c04-a787-2a4615710127",
    "Plantes" => "e06bc600-2f0d-412d-8e41-6352d53d5cd4",
    "Zones" => "99e54372-4d78-4869-8413-466165d125de",
    "Timesheets" => "9beb159f-9211-4e25-a807-2bff7c52aac1",
    "Calendrier" => "b803cc5f-11a0-4e5e-85c1-edb285459176",
    "Actions" => "9dbb92ee-cacb-4235-b3fc-c08a09e3a46e",
    "Actions design" => "f6e1b005-f6f9-4bed-8e4d-688a05058799",
    "Projets" => "a0810e5a-43e3-49e2-b3c0-a91a00d0b020",
    "Recettes" => "c0e95b80-ec90-4a3b-949b-c3a7fe49c01e",
  }.freeze

  desc "Download all Notion media files to Active Storage (re-fetches fresh URLs)"
  task download_media: :environment do
    downloader = NotionMediaDownloader.new(logger: Logger.new($stdout))
    total_stats = { downloaded: 0, skipped: 0, errors: 0 }

    NOTION_DATABASES_WITH_FILES.each do |name, db_id|
      puts "\n📦 Processing #{name}..."
      begin
        stats = downloader.download_for_database(db_id, name)
        total_stats[:downloaded] += stats[:downloaded]
        total_stats[:skipped] += stats[:skipped]
        total_stats[:errors] += stats[:errors]
      rescue => e
        puts "  ❌ Failed to process #{name}: #{e.message}"
        total_stats[:errors] += 1
      end
    end

    puts "\n📊 Total: #{total_stats[:downloaded]} downloaded, #{total_stats[:skipped]} skipped, #{total_stats[:errors]} errors"
  end

  desc "Download media for a specific database (e.g. rake notion:download_media_for[Dépenses])"
  task :download_media_for, [:database_name] => :environment do |_t, args|
    name = args[:database_name]
    db_id = NOTION_DATABASES_WITH_FILES[name]
    abort "Unknown database: #{name}. Known: #{NOTION_DATABASES_WITH_FILES.keys.join(', ')}" unless db_id

    downloader = NotionMediaDownloader.new(logger: Logger.new($stdout))
    downloader.download_for_database(db_id, name)
  end
end
