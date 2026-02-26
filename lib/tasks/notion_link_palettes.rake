# frozen_string_literal: true

namespace :notion do
    desc "Link PlantRecords to Design project palettes via Notion Lieu relation"
    task link_palettes: :environment do
      importer = NotionImporter.new
      puts "🔗 Linking plant records to design project palettes..."
  
      # Plant type → palette layer mapping
      layer_map = {
        "Arbre" => "canopy",
        "tree" => "canopy",
        "Arbuste" => "shrub",
        "Arbrisseau" => "sub-canopy",
        "Sous-arbrisseau" => "sub-canopy",
        "Herbacée" => "herbaceous",
        "plante aquatique ?" => "herbaceous",
        "Couvre-sol" => "ground-cover",
        "Grimpante" => "vine"
      }
      default_layer = "shrub"
  
      # 1. Fetch design projects from Notion to get Lieu relations
      database_id = "af042ca6-5380-49b0-83c8-8cdbb1f5662e"
      pages = importer.fetch_database(database_id)
      puts "  Fetched #{pages.size} design projects from Notion"
  
      linked_projects = 0
      total_items = 0
      skipped = 0
      errors = 0
  
      pages.each do |page|
        props = page["properties"]
        notion_id = page["id"]
  
        begin
          # Find the Design::Project in our DB
          project = Design::Project.find_by(notion_id: notion_id)
          unless project
            next
          end
  
          # Extract "Lieu" relation from Notion
          lieu_notion_ids = importer.extract_relations(props, "Lieu")
          if lieu_notion_ids.blank?
            next
          end
  
          # Find Location by notion_id
          location = Location.find_by(notion_id: lieu_notion_ids.first)
          unless location
            skipped += 1
            puts "  ⚠ Location not found for notion_id #{lieu_notion_ids.first} (project: #{project.name})"
            next
          end
  
          # Find PlantRecords linked to this location
          plant_records = PlantRecord.where(location_id: location.id).includes(:species, :variety)
          if plant_records.empty?
            skipped += 1
            puts "  ⚠ No plant records for location #{location.name} (project: #{project.name})"
            next
          end
  
          # Find or create palette for this project
          palette = project.palette || project.create_palette!
  
          # Deduplicate by species_id + variety_id, summing quantities
          # Skip records without a species (can't create valid palette items)
          grouped = {}
          plant_records.select { |pr| pr.species_id.present? }.each do |pr|
            key = [pr.species_id, pr.variety_id]
            if grouped[key]
              grouped[key][:quantity] += (pr.quantity || 1)
            else
              grouped[key] = {
                plant_record: pr,
                quantity: pr.quantity || 1,
                purchase_price: pr.purchase_price
              }
            end
          end
  
          project_items = 0
          grouped.each_value do |data|
            pr = data[:plant_record]
            species = pr.species
            variety = pr.variety
  
            species_id_str = pr.species_id.to_s
            variety_id_str = pr.variety_id&.to_s
  
            # Skip if already exists in palette
            existing = palette.items.find_by(
              species_id: species_id_str,
              variety_id: variety_id_str,
              deleted_at: nil
            )
            if existing
              next
            end
  
            layer = if species
                      layer_map[species.plant_type] || default_layer
                    else
                      default_layer
                    end
  
            common_name = if species && species.common_names_fr.present?
                            species.common_names_fr.split(",").first&.strip || pr.name || ""
                          else
                            pr.name || ""
                          end
  
            palette.items.create!(
              species_id: species_id_str,
              species_name: species&.latin_name || pr.name || "Inconnu",
              variety_id: variety_id_str,
              variety_name: variety&.latin_name,
              common_name: common_name,
              layer: layer,
              quantity: data[:quantity],
              unit_price: data[:purchase_price] || 0,
              harvest_months: species&.harvest_months || [],
              harvest_products: species&.edible_parts || [],
              notes: ""
            )
            project_items += 1
          end
  
          if project_items > 0
            linked_projects += 1
            total_items += project_items
            puts "  ✓ #{project.name}: #{project_items} palette items created (#{plant_records.size} plant records, #{grouped.size} unique species)"
          end
        rescue => e
          errors += 1
          puts "  ❌ Project #{notion_id}: #{e.message}"
        end
      end
  
      puts ""
      puts "Results:"
      puts "  #{linked_projects} projects linked"
      puts "  #{total_items} palette items created"
      puts "  #{skipped} skipped (no location or no plant records)"
      puts "  #{errors} errors"
    end
  end