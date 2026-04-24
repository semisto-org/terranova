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

    desc "Import Academy post-its from Notion as Academy::IdeaNote"
    task post_its: :environment do
      importer = NotionImporter.new
      puts "📥 Importing Academy post-its..."

      database_id = "7cd57a4c-6b5b-405f-85fb-6b7115655c45"
      academy_pole_notion_id = "28df6f30-efe3-421c-9e87-6c111e61c07d"

      # Map Notion "Type" values to Academy::IdeaNote categories
      category_map = {
        "Sujet" => "subject", "Subject" => "subject",
        "Formateur" => "trainer", "Formatrice" => "trainer", "Trainer" => "trainer",
        "Lieu" => "location", "Location" => "location"
      }

      pages = importer.fetch_database(database_id)
      created = updated = skipped = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          # Filter: only import post-its linked to Academy pole
          pole_relation_ids = importer.extract_relations(props, "Pôle(s)/Département(s)")
          unless pole_relation_ids.include?(academy_pole_notion_id)
            skipped += 1
            next
          end

          idea_note = Academy::IdeaNote.find_or_initialize_by(notion_id: notion_id)
          is_new = idea_note.new_record?

          # Fetch page content
          content = nil
          begin
            _blocks, html = importer.fetch_and_convert_page_content(notion_id)
            content = html if html.present?
          rescue => e
            puts "  ⚠️ Could not fetch content for PostIt #{notion_id}: #{e.message}"
          end

          title = importer.extract(props, "Titre") || "Sans titre"
          post_type = importer.extract(props, "Type") || ""
          category = category_map[post_type] || "other"

          # Build tags from available metadata
          tags = []
          tags << post_type if post_type.present? && category == "other"

          idea_note.assign_attributes(
            title: title,
            content: content || "",
            category: category,
            tags: tags,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          idea_note.save!

          importer.upsert_notion_record(
            page,
            database_name: "Post-its",
            database_id: database_id,
            content_html: content
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ PostIt→IdeaNote #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Academy Post-its: #{pages.size} fetched, #{created} created, #{updated} updated, #{skipped} skipped (non-Academy), #{errors} errors"
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

    desc "Import plant varieties from Notion"
    task varieties: :environment do
      importer = NotionImporter.new
      puts "📥 Importing plant varieties..."

      database_id = "0da62621-850d-4c04-a787-2a4615710127"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          latin_name = importer.extract(props, "Nom de la variété") || "Unknown"
          variety = Plant::Variety.find_by(notion_id: notion_id) ||
                    Plant::Variety.find_by(latin_name: latin_name) ||
                    Plant::Variety.new
          is_new = variety.new_record?

          # Link to species via Notion relation
          species_notion_ids = importer.extract_relations(props, "☘️ Espèces")
          species = species_notion_ids.first && Plant::Species.find_by(notion_id: species_notion_ids.first)

          variety.assign_attributes(
            notion_id: notion_id,
            latin_name: latin_name,
            species: species,
            common_names_fr: importer.extract(props, "Noms communs 🇫🇷") || "",
            description: importer.extract(props, "Descriptif") || "",
            characteristics: importer.extract(props, "Caractéristiques") || [],
            labels: importer.extract(props, "Labels") || [],
            usages: importer.extract(props, "Usages") || [],
            fertility: importer.extract(props, "Fertilité") || "",
            juice_quality: importer.extract(props, "Qualité en jus") || "",
            publish_on_website: importer.extract(props, "Publier sur le site web") || false,
            maturity: importer.extract(props, "Maturité sexuelle") || "",
            fruit_size: importer.extract(props, "Dimensions") || "",
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          variety.save!

          importer.upsert_notion_record(
            page,
            database_name: "Variétés",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Variety #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Varieties: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import knowledge base articles from Notion"
    task knowledge: :environment do
      importer = NotionImporter.new
      puts "📥 Importing knowledge base articles..."

      database_id = "95c21630-7ee8-42e0-9d6c-b5bcbe713ae0"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      # Ensure "Recherche & Veille" section exists
      section = KnowledgeSection.find_or_create_by!(name: "Recherche & Veille")

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          title = importer.extract(props, "Name") || "Sans titre"
          topic = KnowledgeTopic.find_or_initialize_by(notion_id: notion_id)
          is_new = topic.new_record?

          # Tags from "Sujets" multi_select
          tags = importer.extract(props, "Sujets") || []
          types = importer.extract(props, "Type") || []
          all_tags = (tags + types).uniq

          # Note + URL
          note = importer.extract(props, "Note") || ""
          url = importer.extract(props, "URL") || ""

          # Fetch page content (blocks → HTML)
          page_html = importer.fetch_and_convert_page_content(notion_id) rescue ""

          # Build content: note + page content + source URL
          content_parts = []
          content_parts << "<p>#{note}</p>" if note.present?
          content_parts << page_html if page_html.present?
          content_parts << "<p><strong>Source :</strong> <a href=\"#{url}\">#{url}</a></p>" if url.present?
          content = content_parts.join("\n")
          content = "<p>#{title}</p>" if content.blank?

          # Author from "Ajoutée par"
          author_name = begin
            prop = props["Ajoutée par"]
            prop&.dig("created_by", "name") || "Import Notion"
          rescue
            "Import Notion"
          end

          topic.assign_attributes(
            title: title,
            content: content,
            tags: all_tags,
            status: "published",
            section_id: section.id,
            author_name: author_name,
            source_url: url,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          topic.save!

          importer.upsert_notion_record(
            page,
            database_name: "Knowledge Base",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ KB Article #{notion_id}: #{e.message}"
        end
      end

      puts "✅ KB Articles: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
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
      Rake::Task["notion:import_batch2:varieties"].invoke
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
      Rake::Task["notion:import_batch2:knowledge"].invoke
      puts ""

      puts "🏁 Notion import batch 2 complete!"
    end
  end
end
