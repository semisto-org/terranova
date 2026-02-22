# frozen_string_literal: true

namespace :notion do
  namespace :import do
    desc "Import contacts from Notion"
    task contacts: :environment do
      importer = NotionImporter.new
      puts "📥 Importing contacts..."

      database_id = "0a7b84b1-6083-433d-b8d4-50fda24008ea"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          contact = Contact.find_or_initialize_by(notion_id: notion_id)
          is_new = contact.new_record?

          contact.assign_attributes(
            name: importer.extract(props, "Name") || "Sans nom",
            email: importer.extract(props, "Email") || "",
            phone: importer.extract(props, "Téléphone") || "",
            contact_type: (importer.extract(props, "Type") || []).first&.downcase == "organization" ? "organization" : "person",
            position: importer.extract(props, "Poste") || "",
            region: importer.extract(props, "Région") || "",
            linkedin_url: importer.extract(props, "LinkedIn") || "",
            expertise: importer.extract(props, "Expertise") || [],
            teams: importer.extract(props, "Teams") || [],
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          # Fetch page content and convert to HTML
          begin
            blocks, html = importer.fetch_and_convert_page_content(notion_id)
            contact.notes_html = html if html.present?
          rescue => e
            puts "  ⚠️ Could not fetch content for #{notion_id}: #{e.message}"
            blocks = nil
            html = nil
          end

          contact.save!

          # Upsert NotionRecord
          importer.upsert_notion_record(
            page,
            database_name: "Contacts",
            database_id: database_id,
            content_blocks: blocks,
            content_html: html
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Contact #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Contacts: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import organizations from Notion (Entreprises et collectifs)"
    task organizations: :environment do
      importer = NotionImporter.new
      puts "📥 Importing organizations..."

      database_id = "2af0c330-0966-45eb-bc1b-ffcf2fffec53"

      # Explore schema
      schema = importer.fetch_database_schema(database_id)
      prop_schema = schema["properties"]
      puts "  📋 Organizations DB properties: #{prop_schema.keys.join(', ')}"

      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          contact = Contact.find_or_initialize_by(notion_id: notion_id)
          is_new = contact.new_record?

          name = importer.extract(props, "Name") || importer.extract(props, "Nom") || "Sans nom"

          contact.assign_attributes(
            name: name,
            contact_type: "organization",
            email: importer.extract(props, "Email") || importer.extract(props, "E-mail") || "",
            phone: importer.extract(props, "Téléphone") || importer.extract(props, "Phone") || "",
            address: importer.extract(props, "Adresse") || importer.extract(props, "Address") || "",
            notes: importer.extract(props, "Notes") || importer.extract(props, "Description") || "",
            linkedin_url: importer.extract(props, "LinkedIn") || importer.extract(props, "Site web") || "",
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          # Fetch page content and convert to HTML
          begin
            blocks, html = importer.fetch_and_convert_page_content(notion_id)
            contact.notes_html = html if html.present?
          rescue => e
            puts "  ⚠️ Could not fetch content for #{notion_id}: #{e.message}"
            blocks = nil
            html = nil
          end

          contact.save!

          importer.upsert_notion_record(
            page,
            database_name: "Entreprises et collectifs",
            database_id: database_id,
            content_blocks: blocks,
            content_html: html
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Organization #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Organizations: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Link contacts (persons) to their organizations via Notion relations"
    task link_contacts_organizations: :environment do
      importer = NotionImporter.new
      puts "🔗 Linking contacts to organizations..."

      database_id = "0a7b84b1-6083-433d-b8d4-50fda24008ea"
      pages = importer.fetch_database(database_id)
      linked = skipped = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          contact = Contact.find_by(notion_id: notion_id)
          next unless contact&.person?

          org_notion_ids = importer.extract_relations(props, "🏢 Entreprises et collectifs")
          if org_notion_ids.any?
            organization = Contact.find_by(notion_id: org_notion_ids.first)
            if organization
              contact.update!(organization_id: organization.id)
              linked += 1
            else
              skipped += 1
            end
          else
            skipped += 1
          end
        rescue => e
          errors += 1
          puts "  ❌ Link #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Links: #{linked} linked, #{skipped} skipped, #{errors} errors"
    end

    desc "Import suppliers from Notion (Fournisseurs)"
    task suppliers: :environment do
      importer = NotionImporter.new
      puts "📥 Importing suppliers..."

      database_id = "d0dbcf84-6892-4327-946d-0ec241df0c06"

      # Explore schema
      schema = importer.fetch_database_schema(database_id)
      prop_schema = schema["properties"]
      puts "  📋 Suppliers DB properties: #{prop_schema.keys.join(', ')}"

      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          contact = Contact.find_or_initialize_by(notion_id: notion_id)
          is_new = contact.new_record?

          name = importer.extract(props, "Name") || importer.extract(props, "Nom") || "Sans nom"

          contact.assign_attributes(
            name: name,
            contact_type: "organization",
            organization_type: "Fournisseur",
            email: importer.extract(props, "Email") || importer.extract(props, "E-mail") || "",
            phone: importer.extract(props, "Téléphone") || importer.extract(props, "Phone") || "",
            address: importer.extract(props, "Adresse") || importer.extract(props, "Address") || "",
            notes: importer.extract(props, "Notes") || importer.extract(props, "Description") || "",
            linkedin_url: importer.extract(props, "Site web") || importer.extract(props, "LinkedIn") || "",
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          # Fetch page content and convert to HTML
          begin
            blocks, html = importer.fetch_and_convert_page_content(notion_id)
            contact.notes_html = html if html.present?
          rescue => e
            puts "  ⚠️ Could not fetch content for #{notion_id}: #{e.message}"
            blocks = nil
            html = nil
          end

          contact.save!

          importer.upsert_notion_record(
            page,
            database_name: "Fournisseurs",
            database_id: database_id,
            content_blocks: blocks,
            content_html: html
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Supplier #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Suppliers: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import locations from Notion"
    task locations: :environment do
      importer = NotionImporter.new
      puts "📥 Importing locations..."

      database_id = "bd96df76-eb53-4893-b317-5d17d6cfe99e"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          location = Academy::TrainingLocation.find_or_initialize_by(notion_id: notion_id)
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

      puts "✅ Locations: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import trainings from Notion"
    task trainings: :environment do
      importer = NotionImporter.new
      puts "📥 Importing trainings..."

      status_map = {
        "Idée" => "idea",
        "À organiser" => "to_organize",
        "En préparation" => "in_preparation",
        "À publier" => "to_publish",
        "Publiée" => "published",
        "En cours" => "in_progress",
        "Post-formation" => "post_training",
        "Annulée" => "cancelled",
        "Terminée" => "completed"
      }

      registration_mode_map = {
        "Inscriptions ouvertes" => "open",
        "Inscriptions closes" => "closed"
      }

      database_id = "94dd7ee2-457e-452b-92bd-aeeee152c376"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          training = Academy::Training.find_or_initialize_by(notion_id: notion_id)
          is_new = training.new_record?

          type_name = importer.extract(props, "Type")
          training_type = if type_name.present?
                            Academy::TrainingType.find_or_create_by!(name: type_name)
                          else
                            Academy::TrainingType.find_or_create_by!(name: "Autre")
                          end

          notion_status = importer.extract(props, "Statut")
          status = status_map[notion_status] || "idea"

          notion_reg_mode = importer.extract(props, "(PG) Mode")
          reg_mode = registration_mode_map[notion_reg_mode] || ""

          location_notion_ids = importer.extract_relations(props, "Lieu")
          location = location_notion_ids.first && Academy::TrainingLocation.find_by(notion_id: location_notion_ids.first)

          facilitator_notion_ids = importer.extract_relations(props, "Facilitateur·rice(s)")
          facilitator_contacts = Contact.where(notion_id: facilitator_notion_ids)

          training.assign_attributes(
            title: importer.extract(props, "Name") || "Sans titre",
            description: importer.extract(props, "Descriptif") || "",
            status: status,
            training_type: training_type,
            max_participants: (importer.extract(props, "Places disponibles") || 0).to_i,
            price: (importer.extract(props, "Tarif/participant") || 0).to_d,
            feedback: importer.extract(props, "Retours") || "",
            photo_album_url: importer.extract(props, "Album photo") || "",
            public_page_url: importer.extract(props, "Page web publique") || "",
            private_page_url: importer.extract(props, "Page web privée") || "",
            punchpass_url: importer.extract(props, "Punchpass") || "",
            registration_mode: reg_mode,
            location_id: location&.id,
            facilitator_ids: facilitator_contacts.pluck(:id),
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          training.save!

          importer.upsert_notion_record(
            page,
            database_name: "Formations",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Training #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Trainings: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import registrations from Notion"
    task registrations: :environment do
      importer = NotionImporter.new
      puts "📥 Importing registrations..."

      database_id = "0c9b406f-1b9e-4329-94c4-3105e7fbe246"
      schema = importer.fetch_database_schema(database_id)
      prop_schema = schema["properties"]
      puts "  📋 Registration DB properties: #{prop_schema.keys.join(', ')}"

      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          reg = Academy::TrainingRegistration.find_or_initialize_by(notion_id: notion_id)
          is_new = reg.new_record?

          contact_name = importer.extract(props, "Name") ||
                         importer.extract(props, "Nom") ||
                         importer.extract(props, "Participant") || "Inconnu"

          training_notion_ids = importer.extract_relations(props, "Formation") +
                                importer.extract_relations(props, "Training")
          training = training_notion_ids.first && Academy::Training.find_by(notion_id: training_notion_ids.first)

          next unless training

          email = importer.extract(props, "Email") || importer.extract(props, "E-mail") || ""
          phone = importer.extract(props, "Téléphone") || importer.extract(props, "Phone") || ""
          payment_status = importer.extract(props, "Paiement") || importer.extract(props, "Statut paiement") || ""
          amount = importer.extract(props, "Montant") || importer.extract(props, "Montant payé") || 0

          payment_status_map = {
            "Payé" => "paid", "Paid" => "paid",
            "Partiel" => "partial", "Partial" => "partial",
            "En attente" => "pending", "Pending" => "pending"
          }
          mapped_payment = payment_status_map[payment_status] || "pending"

          registered_at = importer.extract(props, "Date") ||
                          importer.extract(props, "Date d'inscription") ||
                          importer.extract(props, "Created time") ||
                          page["created_time"]

          # Link to contact via Notion relations or email fallback
          contact_notion_ids = importer.extract_relations(props, "Participant") +
                               importer.extract_relations(props, "Contact")
          linked_contact = contact_notion_ids.first && Contact.find_by(notion_id: contact_notion_ids.first)
          linked_contact ||= Contact.find_by(email: email) if email.present?

          reg.assign_attributes(
            training: training,
            contact_name: contact_name,
            contact_email: email,
            phone: phone,
            payment_status: mapped_payment,
            amount_paid: amount.to_d,
            registered_at: registered_at,
            contact: linked_contact,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          reg.save!

          importer.upsert_notion_record(
            page,
            database_name: "Inscriptions",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Registration #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Registrations: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import revenues from Notion"
    task revenues: :environment do
      importer = NotionImporter.new
      puts "📥 Importing revenues..."

      database_id = "c0e95b80-ec90-4a3b-949b-c3a7fe49c01e"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          revenue = Revenue.find_or_initialize_by(notion_id: notion_id)
          is_new = revenue.new_record?

          contact_notion_ids = importer.extract_relations(props, "Client")
          contact = contact_notion_ids.first && Contact.find_by(notion_id: contact_notion_ids.first)

          training_notion_ids = importer.extract_relations(props, "Formation")
          training = training_notion_ids.first && Academy::Training.find_by(notion_id: training_notion_ids.first)

          design_notion_ids = importer.extract_relations(props, "Design")
          design_project = design_notion_ids.first && Design::Project.find_by(notion_id: design_notion_ids.first) rescue nil

          pole_notion_ids = importer.extract_relations(props, "Pôle/Guilde transverse")
          pole_name = nil
          if pole_notion_ids.any?
            begin
              pole_page = importer.send(:api_get, "/pages/#{pole_notion_ids.first}")
              pole_props = pole_page["properties"]
              pole_name = importer.extract(pole_props, "Name") || importer.extract(pole_props, "Nom")
              pole_map = {
                "Academy" => "academy", "Académie" => "academy", "Formation" => "academy", "Formations" => "academy",
                "Design Studio" => "design_studio", "Design" => "design_studio", "Design Labs" => "design_studio", "Bureau d'études" => "design_studio",
                "Nursery" => "nursery", "Pépinière" => "nursery",
                "Roots" => "roots", "Racines" => "roots", "Transverse" => "roots"
              }
              pole_name = pole_map[pole_name] || (Revenue::POLES.include?(pole_name&.downcase) ? pole_name.downcase : nil)
            rescue
              # ignore
            end
          end

          status_raw = importer.extract(props, "Statut") || "draft"
          status_map = { "Brouillon" => "draft", "Confirmé" => "confirmed", "Reçu" => "received" }
          status = status_map[status_raw] || "draft"

          revenue.assign_attributes(
            label: importer.extract(props, "Libellé") || "",
            date: importer.extract(props, "Date"),
            amount_excl_vat: (importer.extract(props, "Montant HTVA") || 0).to_d,
            amount: (importer.extract(props, "Montant HTVA") || 0).to_d,
            vat_6: (importer.extract(props, "TVA 6%") || 0).to_d,
            vat_21: (importer.extract(props, "TVA 21%") || 0).to_d,
            status: status,
            payment_method: importer.extract(props, "Mode de paiement") || "",
            category: importer.extract(props, "Catégorie") || "",
            vat_rate: importer.extract(props, "Taux TVA") || "",
            vat_exemption: importer.extract(props, "Exonération TVA") || false,
            contact: contact,
            training: training,
            design_project: design_project,
            invoice_url: importer.extract(props, "Lien facture") || "",
            paid_at: importer.extract(props, "Payé"),
            pole: pole_name || "",
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          revenue.save!

          importer.upsert_notion_record(
            page,
            database_name: "Revenus",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Revenue #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Revenues: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import expenses from Notion"
    task expenses: :environment do
      importer = NotionImporter.new
      puts "📥 Importing expenses..."

      database_id = "74875c4c-693e-48df-8e63-0f276a272f8e"
      schema = importer.fetch_database_schema(database_id)
      prop_schema = schema["properties"]
      puts "  📋 Expense DB properties: #{prop_schema.keys.join(', ')}"

      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      status_map = {
        "Planifié" => "planned", "Planned" => "planned",
        "En traitement" => "processing", "Processing" => "processing",
        "À payer" => "ready_for_payment",
        "Payé" => "paid", "Paid" => "paid"
      }

      expense_type_map = {
        "Services et biens" => "services_and_goods",
        "Salaires" => "salaries",
        "Marchandises" => "merchandise",
        "Autre" => "other",
        "Impôt des sociétés" => "corporate_tax",
        "Charges exceptionnelles" => "exceptional_expenses",
        "Charges financières" => "financial_expenses",
        "Provisions et amortissements" => "provisions_and_depreciation",
        "Taxes et redevances" => "taxes_and_duties"
      }

      payment_type_map = {
        "Carte Triodos" => "card_triodos",
        "Virement Triodos" => "transfer_triodos",
        "Cash" => "cash",
        "Remboursement Michael" => "reimbursement_michael",
        "Membre" => "member",
        "Stripe fee" => "stripe_fee"
      }

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          expense = Expense.find_or_initialize_by(notion_id: notion_id)
          is_new = expense.new_record?

          name = importer.extract(props, "Name") || importer.extract(props, "Nom") || ""
          invoice_date = importer.extract(props, "Facture") || importer.extract(props, "Date facture") || importer.extract(props, "Date")
          status_raw = importer.extract(props, "Statut") || importer.extract(props, "Status") || "processing"
          status = status_map[status_raw] || "processing"
          # If no invoice date, force planned status (invoice_date not required for planned)
          status = "planned" if invoice_date.blank? && status != "planned"

          type_raw = importer.extract(props, "Type") || importer.extract(props, "Type de dépense") || "other"
          expense_type = expense_type_map[type_raw] || "other"

          payment_raw = importer.extract(props, "Mode de paiement") || importer.extract(props, "Paiement") || importer.extract(props, "Type de paiement") || ""
          payment_type = payment_type_map[payment_raw] || nil

          category = importer.extract(props, "Catégorie") || importer.extract(props, "Category") || ""

          supplier_notion_ids = importer.extract_relations(props, "Fournisseur") +
                                importer.extract_relations(props, "Supplier")
          supplier_contact = supplier_notion_ids.first && Contact.find_by(notion_id: supplier_notion_ids.first)

          training_notion_ids = importer.extract_relations(props, "Formation") +
                                importer.extract_relations(props, "Training")
          training = training_notion_ids.first && Academy::Training.find_by(notion_id: training_notion_ids.first)

          design_notion_ids = importer.extract_relations(props, "Design") +
                              importer.extract_relations(props, "Projet design")
          design_project = design_notion_ids.first && Design::Project.find_by(notion_id: design_notion_ids.first) rescue nil

          pole_raw = importer.extract(props, "Pôle") || importer.extract(props, "Pole") || ""
          poles = pole_raw.is_a?(Array) ? pole_raw.map(&:downcase) : [pole_raw.downcase].reject(&:blank?)

          expense.assign_attributes(
            name: name,
            status: status,
            expense_type: expense_type,
            amount_excl_vat: (importer.extract(props, "Montant HTVA") || importer.extract(props, "Montant") || 0).to_d,
            vat_6: (importer.extract(props, "TVA 6%") || 0).to_d,
            vat_21: (importer.extract(props, "TVA 21%") || 0).to_d,
            total_incl_vat: (importer.extract(props, "Total TVAC") || importer.extract(props, "Total") || 0).to_d,
            invoice_date: invoice_date,
            payment_date: importer.extract(props, "Paiement") || importer.extract(props, "Date paiement") || importer.extract(props, "Payé"),
            payment_type: payment_type,
            category: category.presence && Expense::EXPENSE_CATEGORIES.include?(category) ? category : nil,
            supplier_contact: supplier_contact,
            supplier: supplier_contact&.name || importer.extract(props, "Fournisseur (texte)") || (supplier_contact ? "" : "Import Notion"),
            training: training,
            design_project: design_project,
            vat_rate: begin
              raw_vat = importer.extract(props, "Taux TVA") || ""
              vat_rate_map = { "0%" => "0", "6%" => "6", "12%" => "12", "21%" => "21", "N/A" => "na", "Intracommunautaire" => "intracom",
                               "0" => "0", "6" => "6", "12" => "12", "21" => "21", "na" => "na", "intracom" => "intracom" }
              vat_rate_map[raw_vat] || (Expense::VAT_RATES.include?(raw_vat) ? raw_vat : nil)
            end,
            billing_zone: begin
              raw_zone = importer.extract(props, "Zone de facturation") || importer.extract(props, "Zone") || ""
              zone_map = {
                "Belgique" => "belgium", "Belgium" => "belgium", "BE" => "belgium",
                "Intra-UE" => "intra_eu", "Intra-EU" => "intra_eu", "UE" => "intra_eu", "EU" => "intra_eu", "Intracommunautaire" => "intra_eu",
                "Extra-UE" => "extra_eu", "Extra-EU" => "extra_eu", "Hors UE" => "extra_eu",
                "belgium" => "belgium", "intra_eu" => "intra_eu", "extra_eu" => "extra_eu"
              }
              zone_map[raw_zone] || nil
            end,
            poles: poles,
            notes: importer.extract(props, "Notes") || "",
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          expense.save!

          importer.upsert_notion_record(
            page,
            database_name: "Dépenses",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Expense #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Expenses: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end
  end

  desc "Import all data from Notion"
  task import: :environment do
    puts "🚀 Starting full Notion import..."
    puts ""

    Rake::Task["notion:import:contacts"].invoke
    puts ""
    Rake::Task["notion:import:organizations"].invoke
    puts ""
    Rake::Task["notion:import:suppliers"].invoke
    puts ""
    Rake::Task["notion:import:locations"].invoke
    puts ""
    Rake::Task["notion:import:trainings"].invoke
    puts ""
    Rake::Task["notion:import:registrations"].invoke
    puts ""
    Rake::Task["notion:import:revenues"].invoke
    puts ""
    Rake::Task["notion:import:expenses"].invoke
    puts ""
    Rake::Task["notion:import:link_contacts_organizations"].invoke
    puts ""

    puts "🏁 Notion import complete!"
  end
end
