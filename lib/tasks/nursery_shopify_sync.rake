# frozen_string_literal: true

require "net/http"
require "json"
require "uri"

namespace :nursery do
  desc "Sync stock batches for Arbuste Fruitier from their Shopify store"
  task shopify_sync: :environment do
    shopify_store_url = "https://www.arbustefruitier.com"
    nursery_name      = "Arbuste Fruitier"

    non_plant_patterns = [
      /initiation aux jardins/i,
      /formation/i,
      /stage/i,
      /workshop/i,
      /atelier/i,
    ].freeze

    # Best-effort genus → plant_type; falls back to 'shrub'
    genus_plant_types = {
      "Juglans"      => "tree",
      "Castanea"     => "tree",
      "Tilia"        => "tree",
      "Hovenia"      => "tree",
      "Tetradium"    => "tree",
      "Celtis"       => "tree",
      "Morus"        => "tree",
      "Ficus"        => "tree",
      "Diospyros"    => "tree",
      "Sorbus"       => "tree",
      "Mespilus"     => "tree",
      "Cydonia"      => "tree",
      "Toona"        => "tree",
      "Allium"       => "herbaceous",
      "Fragaria"     => "herbaceous",
      "Mentha"       => "herbaceous",
      "Melissa"      => "herbaceous",
      "Monarda"      => "herbaceous",
      "Galium"       => "herbaceous",
      "Armoracia"    => "herbaceous",
      "Hemerocallis" => "herbaceous",
      "Stachys"      => "herbaceous",
      "Artemisia"    => "herbaceous",
      "Agastache"    => "herbaceous",
    }.freeze

    puts "=== Nursery Shopify Sync: #{nursery_name} ==="
    puts "Source: #{shopify_store_url}"
    puts

    # ── 1. Find or create the nursery ────────────────────────────────
    nursery = Nursery::Nursery.find_or_initialize_by(name: nursery_name)
    if nursery.new_record?
      nursery.nursery_type = "partner"
      nursery.integration  = "platform"
      nursery.website      = shopify_store_url
      nursery.save!
      puts "Nursery created (id=#{nursery.id})"
    else
      puts "Nursery found (id=#{nursery.id})"
    end

    # ── 2. Ensure standard containers exist ──────────────────────────
    containers = {
      "P9" => Nursery::Container.find_or_create_by!(short_name: "P9") { |c| c.name = "Pot 9cm";      c.volume_liters = 0.5; c.sort_order = 1 },
      "C2" => Nursery::Container.find_or_create_by!(short_name: "C2") { |c| c.name = "Conteneur 2L"; c.volume_liters = 2.0; c.sort_order = 2 },
      "C5" => Nursery::Container.find_or_create_by!(short_name: "C5") { |c| c.name = "Conteneur 5L"; c.volume_liters = 5.0; c.sort_order = 3 },
      "RN" => Nursery::Container.find_or_create_by!(short_name: "RN") { |c| c.name = "Racines nues"; c.sort_order = 4 },
    }

    # ── 3. Fetch all products from Shopify ───────────────────────────
    products = []
    page = 1
    loop do
      uri = URI("#{shopify_store_url}/products.json?limit=250&page=#{page}")
      response = Net::HTTP.get_response(uri)
      unless response.is_a?(Net::HTTPSuccess)
        abort "Shopify API error #{response.code} on page #{page}"
      end
      batch = JSON.parse(response.body)["products"] || []
      break if batch.empty?
      products.concat(batch)
      break if batch.size < 250
      page += 1
    end
    puts "Fetched #{products.size} products from Shopify (#{page} page(s))"
    puts

    # ── 4. Sync each product ─────────────────────────────────────────
    created = 0
    updated = 0
    skipped = 0
    sync_errors = []

    products.each do |product|
      title = product["title"].to_s.strip

      # Skip non-plant products
      if non_plant_patterns.any? { |pat| title.match?(pat) }
        puts "  [SKIP non-plant] #{title}"
        skipped += 1
        next
      end

      parsed = parse_shopify_title(title)
      unless parsed
        puts "  [SKIP no-latin] #{title}"
        skipped += 1
        next
      end

      latin_name   = parsed[:latin_name]
      variety_name = parsed[:variety_name]
      common_fr    = parsed[:common_fr]

      # First variant drives price + availability + container
      variant        = product["variants"]&.first
      price          = variant&.dig("price")&.to_d || BigDecimal("0")
      shopify_avail  = variant&.dig("available") || false
      container_key  = shopify_variant_to_container_key(variant&.dig("title").to_s)
      container      = containers[container_key]

      status = shopify_avail ? "available" : "sold_out"

      # Species
      genus_key  = latin_name.split.first
      plant_type = genus_plant_types.fetch(genus_key, "shrub")
      species = Plant::Species.find_or_create_by!(latin_name: latin_name) do |s|
        s.plant_type     = plant_type
        s.common_names_fr = common_fr
      end

      # Variety (optional)
      variety = if variety_name.present?
        Plant::Variety.find_or_create_by!(species: species, latin_name: variety_name) do |v|
          v.common_names_fr = common_fr
        end
      end

      # Stock batch — keyed by nursery + species + variety
      batch = Nursery::StockBatch.find_or_initialize_by(
        nursery: nursery,
        species: species,
        variety: variety
      )

      is_new = batch.new_record?
      batch.status       = status
      batch.price_euros  = price
      batch.growth_stage = batch.growth_stage.presence || "young"
      batch.container    = container
      batch.origin       = "shopify:#{product['id']}"

      if batch.save
        if is_new
          created += 1
          puts "  [CREATE] #{latin_name}#{variety_name.present? ? " '#{variety_name}'" : ""} → #{status} €#{price}"
        else
          updated += 1
          puts "  [UPDATE] #{latin_name}#{variety_name.present? ? " '#{variety_name}'" : ""} → #{status} €#{price}"
        end
      else
        sync_errors << { title: title, messages: batch.errors.full_messages }
        puts "  [ERROR]  #{title}: #{batch.errors.full_messages.join(', ')}"
      end
    end

    # Archive batches that came from Shopify but are no longer in the catalog
    shopify_origins = products.map { |p| "shopify:#{p['id']}" }
    archived = Nursery::StockBatch
      .where(nursery: nursery)
      .where("origin LIKE 'shopify:%'")
      .where.not(origin: shopify_origins)
      .where(status: %w[available in_production])
      .update_all(status: "archived")
    puts "\nArchived #{archived} batches removed from Shopify catalog" if archived > 0

    puts
    puts "=== Summary ==="
    puts "  Created : #{created}"
    puts "  Updated : #{updated}"
    puts "  Skipped : #{skipped}"
    puts "  Errors  : #{sync_errors.size}"
    sync_errors.each { |e| puts "    - #{e[:title]}: #{e[:messages].join(', ')}" }
    puts
    puts "Sync complete."
  end
end

# ── Helpers ─────────────────────────────────────────────────────────────────

# Parse a Shopify product title into components.
# Handles:
#   "Figuier 'Brown Turkey' - Ficus carica"   → variety present
#   "Menthe pomme - Mentha suaveolens"         → no variety
#   "Pluot 'Cherny Prince' - Prunus s. x a."  → variety + hybrid species
def parse_shopify_title(title)
  # Must contain a dash separating common name from latin name
  return nil unless title.include?(" - ")

  # Split on last occurrence of " - " to handle names with dashes
  idx         = title.rindex(" - ")
  common_part = title[0...idx].strip
  latin_name  = title[(idx + 3)..].strip

  return nil if latin_name.blank?

  # Extract cultivar/variety from common part: "Figuier 'Brown Turkey'"
  variety_name = nil
  common_fr    = common_part
  if common_part =~ /\A(.+?)\s+'([^']+)'\z/
    common_fr    = $1.strip
    variety_name = $2.strip
  end

  { common_fr: common_fr, variety_name: variety_name, latin_name: latin_name }
end

# Map a Shopify variant title to a container short_name key
def shopify_variant_to_container_key(variant_title)
  t = variant_title.downcase
  if t.include?("godet") || t.include?("1l")
    "P9"
  elsif t.include?("2l")
    "C2"
  elsif t.include?("5l") || t.include?("10l")
    "C5"
  elsif t.include?("racin") || t.include?("nu")
    "RN"
  else
    "C2" # sensible default for fruit shrubs
  end
end
