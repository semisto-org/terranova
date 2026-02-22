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

    desc "Import plant genera from Notion"
    task genera: :environment do
      importer = NotionImporter.new
      puts "📥 Importing plant genera..."

      database_id = "0d532316-50fd-4d44-9652-0814662f02b8"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          genus = Plant::Genus.find_or_initialize_by(notion_id: notion_id)
          is_new = genus.new_record?

          genus.assign_attributes(
            latin_name: importer.extract(props, "Nom") || "Unknown",
            common_name: importer.extract(props, "Nom commun") || "",
            wikipedia_url: importer.extract(props, "Wikipedia") || "",
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          genus.save!

          importer.upsert_notion_record(
            page,
            database_name: "Genres",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Genus #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Genera: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import plant species from Notion"
    task species: :environment do
      importer = NotionImporter.new
      puts "📥 Importing plant species..."

      database_id = "43e8af73-6791-4b19-adbd-e182eadd85c8"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          species = Plant::Species.find_or_initialize_by(notion_id: notion_id)
          is_new = species.new_record?

          # Resolve genus via Notion relation
          genus_notion_ids = importer.extract_relations(props, "Genre")
          genus = genus_notion_ids.first && Plant::Genus.find_by(notion_id: genus_notion_ids.first)

          # flower_colors: rich_text split by comma into jsonb array
          flower_colors_raw = importer.extract(props, "🌸 Couleur des fleurs") || ""
          flower_colors = flower_colors_raw.split(/\s*,\s*/).reject(&:blank?)

          # flowering_months: rich_text split by comma
          flowering_months_raw = importer.extract(props, "💐 Floraison") || ""
          flowering_months = flowering_months_raw.split(/\s*,\s*/).reject(&:blank?)

          species.assign_attributes(
            latin_name: importer.extract(props, "Nom latin") || "Unknown",
            description: importer.extract(props, "Descriptif") || "",
            genus_id: genus&.id,
            plant_type: (importer.extract(props, "Type") || []).first || species.plant_type || "tree",
            exposures: importer.extract(props, "⛅️ Exposition") || [],
            edible_parts: importer.extract(props, "🥗 Parties comestibles") || [],
            ecosystem_needs: importer.extract(props, "Besoins écosystémiques") || [],
            growth_rate: importer.extract(props, "Croissance") || species.growth_rate || "medium",
            hardiness: importer.extract(props, "❄️ Rusticité") || "",
            soil_moisture: (importer.extract(props, "Humidité du sol") || []).first || species.soil_moisture || "moist",
            life_cycle: importer.extract(props, "♽ Cycle de vie") || species.life_cycle || "perennial",
            foliage_type: importer.extract(props, "🌿 Feuillage") || species.foliage_type || "deciduous",
            propagation_methods: importer.extract(props, "✖️ Multiplication") || [],
            pollination_type: (importer.extract(props, "🐝 Pollinisation") || []).first || species.pollination_type || "insect",
            harvest_months: importer.extract(props, "Récolte") || [],
            flower_colors: flower_colors,
            flowering_months: flowering_months,
            fodder_qualities: importer.extract(props, "🐑 Qualités fourragères") || [],
            interests: importer.extract(props, "Intérêts") || [],
            is_invasive: importer.extract(props, "⚠️ Invasive") || false,
            origin: importer.extract(props, "🗺 Origine") || "",
            root_system: (importer.extract(props, "Racine") || []).first || species.root_system || "fibrous",
            planting_seasons: importer.extract(props, "Plantation") || [],
            height_description: importer.extract(props, "↕ Hauteur") || "",
            spread_description: importer.extract(props, "↔️ Diamètre") || "",
            is_native_belgium: importer.extract(props, "🇧🇪 Indigène") || false,
            common_names_fr: importer.extract(props, "Noms communs 🇫🇷") || "",
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          species.save!

          importer.upsert_notion_record(
            page,
            database_name: "Espèces",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Species #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Species: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import design projects from Notion"
    task designs: :environment do
      importer = NotionImporter.new
      puts "📥 Importing design projects..."

      database_id = "af042ca6-5380-49b0-83c8-8cdbb1f5662e"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      status_map = {
        "En cours" => "active",
        "Terminé" => "completed",
        "En attente" => "pending",
        "Archivé" => "archived",
        "Annulé" => "archived"
      }

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          project = Design::Project.find_or_initialize_by(notion_id: notion_id)
          is_new = project.new_record?

          notion_status = importer.extract(props, "Statut")
          status = status_map[notion_status] || "pending"

          # Porteur(s) de projet → client info
          contact_notion_ids = importer.extract_relations(props, "Porteur(s) de projet")
          client_contact = contact_notion_ids.first && Contact.find_by(notion_id: contact_notion_ids.first)

          client_name = client_contact&.name || importer.extract(props, "Dénomination") || "Import Notion"
          client_email = importer.extract(props, "E-mail") || client_contact&.email || ""
          client_phone = importer.extract(props, "Téléphone") || client_contact&.phone || ""

          # Lieu relation → location coordinates
          lieu_notion_ids = importer.extract_relations(props, "Lieu")
          lieu = lieu_notion_ids.first && Academy::TrainingLocation.find_by(notion_id: lieu_notion_ids.first)

          attrs = {
            name: importer.extract(props, "Dénomination") || "Sans nom",
            status: status,
            project_type: importer.extract(props, "Type de projet") || "",
            address: importer.extract(props, "Localisation") || "",
            client_id: client_contact&.id&.to_s || project.client_id || "notion-import",
            client_name: client_name,
            client_email: client_email,
            client_phone: client_phone,
            hours_planned: (importer.extract(props, "Budget d'heures") || 0).to_i,
            google_photos_url: importer.extract(props, "Google Photos") || "",
            website_url: importer.extract(props, "Site web") || "",
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          }

          project.assign_attributes(attrs)

          # Set phase default for new records
          project.phase ||= "offre"

          project.save!

          importer.upsert_notion_record(
            page,
            database_name: "Designs",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Design #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Designs: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import timesheets from Notion"
    task timesheets: :environment do
      importer = NotionImporter.new
      puts "📥 Importing timesheets..."

      database_id = "9beb159f-9211-4e25-a807-2bff7c52aac1"
      pages = importer.fetch_database(database_id)
      created = updated = skipped = errors = 0

      mode_map = {
        "Facturé" => "billed",
        "Billed" => "billed",
        "SEMOS" => "semos",
        "Semos" => "semos"
      }

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          # project_id is required — skip if no Design linked
          design_notion_ids = importer.extract_relations(props, "Design")
          project = design_notion_ids.first && Design::Project.find_by(notion_id: design_notion_ids.first)
          unless project
            skipped += 1
            next
          end

          timesheet = Design::ProjectTimesheet.find_or_initialize_by(notion_id: notion_id)
          is_new = timesheet.new_record?

          member_people = importer.extract(props, "Membre de la Team") || []
          member_name = member_people.first || "Unknown"

          mode_raw = importer.extract(props, "Rémunération") || ""
          mode = mode_map[mode_raw] || "billed"

          # Training relation
          training_notion_ids = importer.extract_relations(props, "Formation")
          training = training_notion_ids.first && Academy::Training.find_by(notion_id: training_notion_ids.first)

          timesheet.assign_attributes(
            project_id: project.id,
            notes: importer.extract(props, "Descriptif court de l'activité") || "",
            date: importer.extract(props, "Date de la prestation") || Date.today,
            hours: (importer.extract(props, "Heures prestées") || 0).to_d,
            travel_km: (importer.extract(props, "KM (A/R)") || 0).to_i,
            phase: importer.extract(props, "Etape du design") || "offre",
            mode: mode,
            member_id: member_name.parameterize,
            member_name: member_name,
            billed: importer.extract(props, "Facturé ?") || false,
            training_id: training&.id,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          timesheet.save!

          importer.upsert_notion_record(
            page,
            database_name: "Timesheets",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Timesheet #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Timesheets: #{pages.size} fetched, #{created} created, #{updated} updated, #{skipped} skipped, #{errors} errors"
    end

    desc "Import events (calendrier) from Notion"
    task events: :environment do
      importer = NotionImporter.new
      puts "📥 Importing events..."

      database_id = "b803cc5f-11a0-4e5e-85c1-edb285459176"
      pages = importer.fetch_database(database_id)
      created = updated = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          event = Event.find_or_initialize_by(notion_id: notion_id)
          is_new = event.new_record?

          # Event type from multi_select
          event_type_names = importer.extract(props, "Type d'événement") || []
          event_type_name = event_type_names.first || "Autre"
          event_type = EventType.find_or_create_by!(label: event_type_name)

          # Date: Notion date has start and optionally end
          date_prop = props["Date"]
          start_date = date_prop&.dig("date", "start")
          end_date = date_prop&.dig("date", "end") || start_date

          # Build description from Heure + Notes
          heure = importer.extract(props, "Heure") || ""
          notes = importer.extract(props, "Notes") || ""
          description_parts = []
          description_parts << "Heure : #{heure}" if heure.present?
          description_parts << notes if notes.present?

          # Design relations → store in description
          design_notion_ids = importer.extract_relations(props, "Design(s)")
          if design_notion_ids.any?
            design_names = Design::Project.where(notion_id: design_notion_ids).pluck(:name)
            description_parts << "Designs : #{design_names.join(', ')}" if design_names.any?
          end

          location = importer.extract(props, "Lieu ou URL") || ""

          event.assign_attributes(
            title: importer.extract(props, "Libellé") || "Sans titre",
            start_date: start_date || Time.current,
            end_date: end_date || start_date || Time.current,
            location: location,
            description: description_parts.join("\n"),
            event_type: event_type,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          event.save!

          importer.upsert_notion_record(
            page,
            database_name: "Calendrier",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Event #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Events: #{pages.size} fetched, #{created} created, #{updated} updated, #{errors} errors"
    end

    desc "Import quotes (offres) from Notion"
    task quotes: :environment do
      importer = NotionImporter.new
      puts "📥 Importing quotes..."

      database_id = "1a0ad42e-4164-48cc-a8da-fa6c0701df4e"
      pages = importer.fetch_database(database_id)
      created = updated = skipped = errors = 0

      status_map = {
        "Brouillon" => "draft",
        "Envoyée" => "sent",
        "Acceptée" => "approved",
        "Refusée" => "rejected",
        "Expirée" => "expired"
      }

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          # Link to design project
          design_notion_ids = importer.extract_relations(props, "Design")
          project = design_notion_ids.first && Design::Project.find_by(notion_id: design_notion_ids.first)
          unless project
            skipped += 1
            next
          end

          quote = Design::Quote.find_or_initialize_by(notion_id: notion_id)
          is_new = quote.new_record?

          notion_status = importer.extract(props, "Statut")
          status = status_map[notion_status] || "draft"

          # Contact (Prospect)
          contact_notion_ids = importer.extract_relations(props, "Prospect(s)")
          contact = contact_notion_ids.first && Contact.find_by(notion_id: contact_notion_ids.first)

          # Author
          author_people = importer.extract(props, "Rédacteur(s)") || []
          author_name = author_people.first || ""

          quote.assign_attributes(
            project_id: project.id,
            title: importer.extract(props, "Dénomination") || "Sans titre",
            status: status,
            sent_at: importer.extract(props, "Date d'envoi"),
            accepted_at: importer.extract(props, "Date d'acceptation"),
            contact_id: contact&.id,
            author_name: author_name,
            valid_until: quote.valid_until || Date.today + 30,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          quote.save!

          importer.upsert_notion_record(
            page,
            database_name: "Offres",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Quote #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Quotes: #{pages.size} fetched, #{created} created, #{updated} updated, #{skipped} skipped, #{errors} errors"
    end

    desc "Import project documents from Notion"
    task documents: :environment do
      importer = NotionImporter.new
      puts "📥 Importing project documents..."

      database_id = "e5a7c104-076a-4dd7-b373-e01636630cc1"
      pages = importer.fetch_database(database_id)
      created = updated = skipped = errors = 0

      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]

        begin
          # Link to design project
          design_notion_ids = importer.extract_relations(props, "Design")
          project = design_notion_ids.first && Design::Project.find_by(notion_id: design_notion_ids.first)
          unless project
            skipped += 1
            next
          end

          doc = Design::ProjectDocument.find_or_initialize_by(notion_id: notion_id)
          is_new = doc.new_record?

          category_values = importer.extract(props, "Type") || []
          category = category_values.first || "other"

          phase_values = importer.extract(props, "Phases") || []
          phase = phase_values.join(", ")

          doc.assign_attributes(
            project_id: project.id,
            name: importer.extract(props, "Nom") || "Sans nom",
            category: category,
            phase: phase,
            url: doc.url || "https://notion.so/#{notion_id.tr('-', '')}",
            uploaded_at: doc.uploaded_at || Time.current,
            notion_created_at: page["created_time"],
            notion_updated_at: page["last_edited_time"]
          )

          doc.save!

          importer.upsert_notion_record(
            page,
            database_name: "Documents",
            database_id: database_id
          )

          is_new ? created += 1 : updated += 1
        rescue => e
          errors += 1
          puts "  ❌ Document #{notion_id}: #{e.message}"
        end
      end

      puts "✅ Documents: #{pages.size} fetched, #{created} created, #{updated} updated, #{skipped} skipped, #{errors} errors"
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
    Rake::Task["notion:import:genera"].invoke
    puts ""
    Rake::Task["notion:import:species"].invoke
    puts ""
    Rake::Task["notion:import:designs"].invoke
    puts ""
    Rake::Task["notion:import:timesheets"].invoke
    puts ""
    Rake::Task["notion:import:events"].invoke
    puts ""
    Rake::Task["notion:import:quotes"].invoke
    puts ""
    Rake::Task["notion:import:documents"].invoke
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
