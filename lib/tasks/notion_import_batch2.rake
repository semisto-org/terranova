# frozen_string_literal: true

namespace :notion do
  namespace :import_batch2 do
    # Helper to extract created_by name (not handled by NotionImporter#extract)
    def extract_created_by_name(props, name)
      prop = props[name]
      return nil unless prop && prop["type"] == "created_by"
      prop.dig("created_by", "name")
    end

    # Helper to extract people names as a single string (first person)
    def extract_people_name(importer, props, name)
      values = importer.extract(props, name)
      return nil unless values.is_a?(Array)
      values.first
    end

    # Helper to extract people names as array
    def extract_people_names(importer, props, name)
      values = importer.extract(props, name)
      return [] unless values.is_a?(Array)
      values
    end

    # Helper to resolve first relation to a record
    def resolve_relation(importer, props, prop_name, model_class)
      notion_ids = importer.extract_relations(props, prop_name)
      return nil if notion_ids.empty?
      model_class.find_by(notion_id: notion_ids.first)
    end

    desc "Import locations into global Location model"
    task locations: :environment do
      importer = NotionImporter.new
      puts "📥 Importing locations (global)..."

      database_id = "bd96df76-eb53-4893-b317-5d17d6cfe99e"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          location = Location.find_or_initialize_by(notion_id: notion_id)
          is_new = location.new_record?

          location.assign_attributes(
            name: importer.extract(props, "Name") || "Sans nom",
            address: importer.extract(props, "Adresse") || "",
            country: importer.extract(props, "Pays") || "",
            location_type: importer.extract(props, "Type") || "",
            website_url: importer.extract(props, "Site web") || "",
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          location.save!

          importer.upsert_notion_record(
            page,
            database_name: "Lieux",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Location #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Locations (global): #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import zones from Notion"
    task zones: :environment do
      importer = NotionImporter.new
      puts "📥 Importing zones..."

      database_id = "99e54372-4d78-4869-8413-466165d125de"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          zone = Location::Zone.find_or_initialize_by(notion_id: notion_id)
          is_new = zone.new_record?

          location = resolve_relation(importer, props, "Lieu", Location)

          zone.assign_attributes(
            name: importer.extract(props, "Nom") || "Sans nom",
            location: location,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          zone.save!

          importer.upsert_notion_record(
            page,
            database_name: "Zones",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Zone #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Zones: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import pole projects from Notion"
    task pole_projects: :environment do
      importer = NotionImporter.new
      puts "📥 Importing pole projects..."

      database_id = "a0810e5a-43e3-49e2-b3c0-a91a00d0b020"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          project = PoleProject.find_or_initialize_by(notion_id: notion_id)
          is_new = project.new_record?

          project.assign_attributes(
            name: importer.extract(props, "Name") || "Sans nom",
            status: importer.extract(props, "État") || "",
            lead_name: extract_people_name(importer, props, "Lead") || "",
            team_names: extract_people_names(importer, props, "Team"),
            needs_reclassification: importer.extract(props, "Nécessite reclassement") || false,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          project.save!

          importer.upsert_notion_record(
            page,
            database_name: "Projets",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ PoleProject #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Pole Projects: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import plant records from Notion"
    task plant_records: :environment do
      importer = NotionImporter.new
      puts "📥 Importing plant records..."

      database_id = "e06bc600-2f0d-412d-8e41-6352d53d5cd4"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          record = PlantRecord.find_or_initialize_by(notion_id: notion_id)
          is_new = record.new_record?

          species = resolve_relation(importer, props, "Espèce", Plant::Species)
          variety = resolve_relation(importer, props, "Variété", Plant::Variety)
          location = resolve_relation(importer, props, "Lieu", Location)
          zone = resolve_relation(importer, props, "Zone", Location::Zone)

          # Extract rich_text notes
          notes_raw = importer.extract(props, "Notes")
          notes_text = notes_raw.is_a?(Array) ? notes_raw.join : (notes_raw || "")

          record.assign_attributes(
            name: importer.extract(props, "Dénomination") || "",
            species: species,
            variety: variety,
            location: location,
            zone: zone,
            planting_date: importer.extract(props, "Date de plantation"),
            purchase_price: importer.extract(props, "Prix d'achat"),
            quantity: importer.extract(props, "Plants"),
            altitude: importer.extract(props, "Altitude"),
            status: importer.extract(props, "Statut") || "",
            health_status: importer.extract(props, "État de santé") || "",
            population: importer.extract(props, "Population") || "",
            plant_type_category: importer.extract(props, "Type de plant") || "",
            nursery_source: importer.extract(props, "Pépinière") || "",
            notes: notes_text,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          record.save!

          importer.upsert_notion_record(
            page,
            database_name: "Plantes",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ PlantRecord #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Plant Records: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import actions from Notion"
    task actions: :environment do
      importer = NotionImporter.new
      puts "📥 Importing actions..."

      database_id = "9dbb92ee-cacb-4235-b3fc-c08a09e3a46e"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          action = Action.find_or_initialize_by(notion_id: notion_id)
          is_new = action.new_record?

          pole_project = resolve_relation(importer, props, "Projet", PoleProject)
          training = resolve_relation(importer, props, "Formation", Academy::Training)

          tags_raw = importer.extract(props, "Tags")
          tags = tags_raw.is_a?(Array) ? tags_raw : []

          action.assign_attributes(
            name: importer.extract(props, "Name") || "",
            status: importer.extract(props, "Statut") || "",
            priority: importer.extract(props, "⭐️") || "",
            due_date: importer.extract(props, "Échéance"),
            time_minutes: importer.extract(props, "Temps (min)"),
            assignee_name: extract_people_name(importer, props, "Responsable") || "",
            action_type: importer.extract(props, "Type de process") || "",
            tags: tags,
            pole_project: pole_project,
            training: training,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          action.save!

          importer.upsert_notion_record(
            page,
            database_name: "Actions",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Action #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Actions: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"

      # Second pass: link parent actions
      puts "🔗 Linking parent actions..."
      linked = 0
      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]
        parent_notion_ids = importer.extract_relations(props, "Élément parent")
        next if parent_notion_ids.empty?

        action = Action.find_by(notion_id: notion_id)
        parent = Action.find_by(notion_id: parent_notion_ids.first)
        if action && parent
          action.update!(parent: parent)
          linked += 1
        end
      rescue => e
        puts "  ❌ Link parent #{notion_id}: #{e.message}"
      end
      puts "✅ Parent links: #{linked} linked"
    end

    desc "Import design actions from Notion"
    task design_actions: :environment do
      importer = NotionImporter.new
      puts "📥 Importing design actions..."

      database_id = "f6e1b005-f6f9-4bed-8e4d-688a05058799"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          action = DesignAction.find_or_initialize_by(notion_id: notion_id)
          is_new = action.new_record?

          design_project = resolve_relation(importer, props, "Design(s)", Design::Project)

          action.assign_attributes(
            name: importer.extract(props, "Nom") || "",
            status: importer.extract(props, "Statut") || "",
            priority: importer.extract(props, "⭐️") || "",
            due_date: importer.extract(props, "Échéance"),
            time_minutes: importer.extract(props, "Temps (min)"),
            time_planned_hours: importer.extract(props, "Temps prévu (h)"),
            assignee_name: extract_people_name(importer, props, "Responsable(s)") || "",
            phase: importer.extract(props, "Étape") || "",
            design_project: design_project,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          action.save!

          importer.upsert_notion_record(
            page,
            database_name: "Actions design",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ DesignAction #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Design Actions: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import post-its from Notion"
    task post_its: :environment do
      importer = NotionImporter.new
      puts "📥 Importing post-its..."

      database_id = "7cd57a4c-6b5b-405f-85fb-6b7115655c45"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          post_it = PostIt.find_or_initialize_by(notion_id: notion_id)
          is_new = post_it.new_record?

          design_project = resolve_relation(importer, props, "Design(s)", Design::Project)
          training = resolve_relation(importer, props, "Formation", Academy::Training)
          pole_project = resolve_relation(importer, props, "Projet(s)", PoleProject)

          # Extract created_by for author
          author = extract_created_by_name(props, "Collé par")

          # Fetch page content
          body = nil
          begin
            _blocks, html = importer.fetch_and_convert_page_content(notion_id)
            body = html if html.present?
          rescue => e
            puts "  ⚠️ Could not fetch content for PostIt #{notion_id}: #{e.message}"
          end

          post_it.assign_attributes(
            title: importer.extract(props, "Titre") || "",
            body: body,
            post_type: importer.extract(props, "Type") || "",
            author_name: author || "",
            date: importer.extract(props, "Date"),
            design_project: design_project,
            training: training,
            pole_project: pole_project,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          post_it.save!

          importer.upsert_notion_record(
            page,
            database_name: "Post-its",
            database_id: database_id,
            content_html: body
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ PostIt #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Post-its: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import notes from Notion"
    task notes: :environment do
      importer = NotionImporter.new
      puts "📥 Importing notes..."

      database_id = "3ca44c70-0ecb-4c53-96ea-b7c19fcd5322"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          note = Note.find_or_initialize_by(notion_id: notion_id)
          is_new = note.new_record?

          pole_project = resolve_relation(importer, props, "Projet(s)", PoleProject)
          author = extract_created_by_name(props, "Enregistrée par")

          tags_raw = importer.extract(props, "Tags")
          tags = tags_raw.is_a?(Array) ? tags_raw : []

          # Fetch page content
          body = nil
          begin
            _blocks, html = importer.fetch_and_convert_page_content(notion_id)
            body = html if html.present?
          rescue => e
            puts "  ⚠️ Could not fetch content for Note #{notion_id}: #{e.message}"
          end

          note.assign_attributes(
            title: importer.extract(props, "Titre") || "",
            body: body,
            note_type: importer.extract(props, "Type") || "",
            tags: tags,
            author_name: author || "",
            archived: importer.extract(props, "Archivé?") || false,
            url: importer.extract(props, "URL") || "",
            pole_project: pole_project,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          note.save!

          importer.upsert_notion_record(
            page,
            database_name: "Notes",
            database_id: database_id,
            content_html: body
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Note #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Notes: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import all batch 2 data from Notion"
    task all: :environment do
      puts "🚀 Starting Notion import batch 2..."
      puts ""

      Rake::Task["notion:import_batch2:locations"].invoke
      puts ""
      Rake::Task["notion:import_batch2:zones"].invoke
      puts ""
      Rake::Task["notion:import_batch2:pole_projects"].invoke
      puts ""
      Rake::Task["notion:import_batch2:plant_records"].invoke
      puts ""
      Rake::Task["notion:import_batch2:actions"].invoke
      puts ""
      Rake::Task["notion:import_batch2:design_actions"].invoke
      puts ""
      Rake::Task["notion:import_batch2:post_its"].invoke
      puts ""
      Rake::Task["notion:import_batch2:notes"].invoke
      puts ""

      puts "🏁 Notion import batch 2 complete!"
    end
  end
end
