# Script de synchronisation du catalogue Arbuste Fruitier (www.arbustefruitier.com)
# Source: Shopify store scrapé le 2026-06-07
# Usage: PGUSER=postgres PGPASSWORD=postgres bin/rails runner lib/tasks/sync_arbuste_fruitier.rb

puts "=== Sync Arbuste Fruitier ==="

# ─── 1. NURSERY ──────────────────────────────────────────────────────────────
nursery = Nursery::Nursery.find_or_create_by!(name: "Arbuste Fruitier") do |n|
  n.nursery_type = "partner"
  n.integration  = "manual"
  n.website      = "https://www.arbustefruitier.com"
  n.description  = "Pépinière belge spécialisée en permaculture, fondée par Corentin Hennuy. Située à Cobreville (Ardenne belge), spécialisée en fruitiers pour jardins-forêts."
  n.city         = "Cobreville"
  n.country      = "BE"
  n.is_pickup_point = false
end
puts "Nursery: #{nursery.name} (id: #{nursery.id})"

# ─── 2. CONTAINERS ───────────────────────────────────────────────────────────
c_godet = Nursery::Container.find_or_create_by!(name: "Pot 9cm") do |c|
  c.short_name    = "P9"
  c.volume_liters = 0.5
  c.sort_order    = 1
end

c_1l = Nursery::Container.find_or_create_by!(name: "Pot 1L") do |c|
  c.short_name    = "P1"
  c.volume_liters = 1.0
  c.sort_order    = 2
end

c_2l = Nursery::Container.find_or_create_by!(name: "Conteneur 2L") do |c|
  c.short_name    = "C2"
  c.volume_liters = 2.0
  c.sort_order    = 3
end

puts "Containers ready: Godet(#{c_godet.id}), Pot 1L(#{c_1l.id}), Conteneur 2L(#{c_2l.id})"

# ─── 3. PRODUCT DATA ─────────────────────────────────────────────────────────
# Format: [common_name_fr, variety_name_or_nil, latin_name, price_euros, available, container]
PRODUCTS = [
  # ── Disponibles ──
  ["Agastache",                     nil,                          "Agastache",                      7.0,  true,  c_1l],
  ["Amandier",                      "Robijn",                     "Prunus dulcis",                  20.0, true,  c_2l],
  ["Amélanchier",                   "Ballerina",                  "Amelanchier laevis",             25.0, true,  c_2l],
  ["Amélanchier",                   "Prince William",             "Amelanchier canadensis",         25.0, true,  c_2l],
  ["Argousier femelle",             "Hergo",                      "Hippophae rhamnoides",           30.0, true,  c_2l],
  ["Argousier mâle",                "Otto",                       "Hippophae rhamnoides",           15.0, true,  c_2l],
  ["Aronie",                        "Hugin",                      "Aronia melanocarpa",             14.0, true,  c_2l],
  ["Aspérule odorante",             nil,                          "Galium odoratum",                 8.0, true,  c_1l],
  ["Caraganier de Sibérie",         nil,                          "Caragana arborescens",           15.0, true,  c_2l],
  ["Cassissier",                    "Titania",                    "Ribes nigrum",                   10.0, true,  c_2l],
  ["Cassissier",                    "Wellington",                 "Ribes nigrum",                   10.0, true,  c_2l],
  ["Chalef de Ebbing",              "Limelight",                  "Elaeagnus ebbingei",             20.0, true,  c_2l],
  ["Chalef de Ebbing",              nil,                          "Elaeagnus ebbingei",             20.0, true,  c_2l],
  ["Ciboule de Chine",              nil,                          "Allium tuberosum",                6.0, true,  c_1l],
  ["Cognassier",                    "Muskatnaja",                 "Cydonia oblonga",                20.0, true,  c_2l],
  ["Cornouiller mâle",              "Juliusz",                    "Cornus mas",                     30.0, true,  c_2l],
  ["Cornouiller mâle",              "Neshny",                     "Cornus mas",                     20.0, true,  c_2l],
  ["Cornouiller mâle",              "Paczoski",                   "Cornus mas",                     30.0, true,  c_2l],
  ["Figuier",                       "Bornholm",                   "Ficus carica",                   30.0, true,  c_2l],
  ["Figuier",                       "Brown Turkey",               "Ficus carica",                   20.0, true,  c_2l],
  ["Figuier",                       "Rouge de Bordeaux",          "Ficus carica",                   20.0, true,  c_2l],
  ["Goji",                          "Sweet Lifeberry®",           "Lycium barbarum",                15.0, true,  c_2l],
  ["Groseillier à grappes",         "Jonkheer van Tets",          "Ribes rubrum",                   10.0, true,  c_2l],
  ["Groseillier à maquereau",       "Hinnonmaki jaune",           "Ribes uva-crispa",               10.0, true,  c_2l],
  ["Micocoulier de Virginie",       nil,                          "Celtis occidentalis",            20.0, true,  c_2l],
  ["Mûrier rouge",                  "Illinois Everbearing",       "Morus rubra",                    30.0, true,  c_2l],
  ["Mûrier sans épines",            "Triple Crown",               "Rubus fruticosus",               10.0, true,  c_2l],
  ["Myrtillier",                    "Bluejay",                    "Vaccinium corymbosum",           16.0, true,  c_2l],
  ["Myrtillier",                    "Duke",                       "Vaccinium corymbosum",           16.0, true,  c_2l],
  ["Myrtillier",                    "Pink Lemonade",              "Vaccinium corymbosum",           16.0, true,  c_2l],
  ["Nashi",                         "Chojuro",                    "Pyrus pyrifolia",                20.0, true,  c_2l],
  ["Nashi",                         "Hosui",                      "Pyrus pyrifolia",                20.0, true,  c_2l],
  ["Nashi",                         "Shinseiki",                  "Pyrus pyrifolia",                20.0, true,  c_2l],
  ["Néflier",                       "Géant de Breda",             "Mespilus germanica",             20.0, true,  c_2l],
  ["Pluot",                         "Cherny Prince",              "Prunus salicina x armeniaca",    25.0, true,  c_2l],
  ["Pluot",                         "Globus",                     "Prunus salicina x armeniaca",    25.0, true,  c_2l],
  ["Poivrier du Sichuan",           nil,                          "Zanthoxylum piperitum",          50.0, true,  c_2l],
  ["Pommier à chair rose",          "Pink Pearl",                 "Malus domestica",                20.0, true,  c_2l],
  ["Pommier du Kazakhstan",         nil,                          "Malus sieversii",                25.0, true,  c_2l],
  ["Raifort",                       nil,                          "Armoracia rusticana",             8.0, true,  c_1l],
  ["Vigne",                         "Arkadia",                    "Vitis vinifera",                 15.0, true,  c_2l],
  ["Vigne",                         "Palatina",                   "Vitis vinifera",                 15.0, true,  c_2l],

  # ── Épuisés ──
  ["Airelle",                       "Red Pearl",                  "Vaccinium vitis-idaea",          nil,  false, c_2l],
  ["Akébie à cinq feuilles",        "Alba",                       "Akebia quinata",                 nil,  false, c_2l],
  ["Akébie à cinq feuilles",        nil,                          "Akebia quinata",                 nil,  false, c_2l],
  ["Amélanchier de Lamarck",        nil,                          "Amelanchier lamarckii",          nil,  false, c_2l],
  ["Arbre à miel",                  nil,                          "Tetradium daniellii",            nil,  false, c_2l],
  ["Asiminier",                     "Allegheny",                  "Asimina triloba",                nil,  false, c_2l],
  ["Asiminier",                     "KSU Chappel",                "Asimina triloba",                nil,  false, c_2l],
  ["Asiminier",                     "Overleese",                  "Asimina triloba",                nil,  false, c_2l],
  ["Asiminier",                     "Rappahannock",               "Asimina triloba",                nil,  false, c_2l],
  ["Asiminier",                     "Shenandoah",                 "Asimina triloba",                nil,  false, c_2l],
  ["Asiminier",                     "VE-21",                      "Asimina triloba",                nil,  false, c_2l],
  ["Aubépine",                      "Zbigniew",                   "Crataegus anomala",              nil,  false, c_2l],
  ["Aubépine à gros fruits",        nil,                          "Crataegus schraderiana",         nil,  false, c_2l],
  ["Aubépine",                      "Big Ball",                   "Crataegus pinnatifida",          nil,  false, c_2l],
  ["Baie de mai",                   "Armur",                      "Lonicera kamtschatica",          nil,  false, c_2l],
  ["Baie de mai",                   "Duet",                       "Lonicera kamtschatica",          nil,  false, c_2l],
  ["Canneberge",                    "Big Pearl",                  "Vaccinium macrocarpon",          nil,  false, c_2l],
  ["Cédrèle de Chine",              nil,                          "Toona sinensis",                 nil,  false, c_2l],
  ["Cerisier",                      "Annabella",                  "Prunus cerasus",                 nil,  false, c_2l],
  ["Cerisier",                      "Early Rivers",               "Prunus cerasus",                 nil,  false, c_2l],
  ["Cerisier",                      "Griotte de Schaerbeek",      "Prunus cerasus",                 nil,  false, c_2l],
  ["Cerisier",                      "Kordia",                     "Prunus cerasus",                 nil,  false, c_2l],
  ["Chalef d'automne",              "Pointilla® Amoroso",         "Elaeagnus umbellata",            nil,  false, c_2l],
  ["Chalef d'automne",              "Pointilla® Fortunella",      "Elaeagnus umbellata",            nil,  false, c_2l],
  ["Chalef d'automne",              "Pointilla® Sweet'N'Sour",    "Elaeagnus umbellata",            nil,  false, c_2l],
  ["Châtaignier",                   "Bouche de Bétizac",          "Castanea sativa x crenata",      nil,  false, c_2l],
  ["Châtaignier",                   "Dorée de Lyon",              "Castanea sativa",                nil,  false, c_2l],
  ["Châtaignier",                   "Maraval",                    "Castanea sativa x crenata",      nil,  false, c_2l],
  ["Ciboulette",                    nil,                          "Allium schoenoprasum",           nil,  false, c_godet],
  ["Cognassier du Japon",           "Cido",                       "Chaenomeles japonica",           nil,  false, c_2l],
  ["Cormier",                       "Sossenheimer Riesen",        "Sorbus domestica",               nil,  false, c_2l],
  ["Cornouiller du Japon",          "Satomi",                     "Cornus kousa",                   nil,  false, c_2l],
  ["Crosne du Japon",               nil,                          "Stachys affinis",                nil,  false, c_godet],
  ["Fraise-abricot",                "Fenhong Se",                 "Fragaria nilgerrensis",          nil,  false, c_godet],
  ["Fraisier",                      "Mara des Bois",              "Fragaria x ananassa",            nil,  false, c_godet],
  ["Fraisier",                      "Snow White",                 "Fragaria x ananassa",            nil,  false, c_godet],
  ["Framboisier",                   "Golden Queen",               "Rubus idaeus",                   nil,  false, c_2l],
  ["Framboisier",                   "Malling Promise",            "Rubus idaeus",                   nil,  false, c_2l],
  ["Goumi du Japon",                nil,                          "Elaeagnus multiflora",           nil,  false, c_2l],
  ["Hémérocalle",                   "Stella de Oro",              "Hemerocallis",                   nil,  false, c_godet],
  ["Kaki",                          "Mikatani Gosho",             "Diospyros kaki",                 nil,  false, c_2l],
  ["Kaki",                          "Russian Beauty",             "Diospyros kaki x virginiana",    nil,  false, c_2l],
  ["Kiwaï femelle",                 "Ken's Red",                  "Actinidia arguta",               nil,  false, c_2l],
  ["Kiwaï mâle",                    "Weiki",                      "Actinidia arguta",               nil,  false, c_2l],
  ["Mélisse",                       nil,                          "Melissa officinalis",            nil,  false, c_1l],
  ["Menthe pomme",                  nil,                          "Mentha suaveolens",              nil,  false, c_1l],
  ["Monarde",                       nil,                          "Monarda didyma",                 nil,  false, c_godet],
  ["Mûrier blanc",                  "Beautiful Day",              "Morus alba",                     nil,  false, c_2l],
  ["Mûrier blanc",                  nil,                          "Morus alba",                     nil,  false, c_2l],
  ["Mûroise",                       "Loganberry",                 "Rubus x loganobaccus",           nil,  false, c_2l],
  ["Nashi",                         "Hayatama",                   "Pyrus pyrifolia",                nil,  false, c_2l],
  ["Néflier",                       "Kurpfalz",                   "Mespilus germanica",             nil,  false, c_2l],
  ["Noisetier",                     "Merveille de Bollwiller",    "Corylus avellana",               nil,  false, c_2l],
  ["Noisetier",                     "Webb's Prize Cobb",          "Corylus avellana",               nil,  false, c_2l],
  ["Noyer",                         "Fernette",                   "Juglans regia",                  nil,  false, c_2l],
  ["Noyer",                         "Fernor",                     "Juglans regia",                  nil,  false, c_2l],
  ["Noyer",                         "Lara",                       "Juglans regia",                  nil,  false, c_2l],
  ["Noyer",                         "Parisienne",                 "Juglans regia",                  nil,  false, c_2l],
  ["Oignon rocambole",              nil,                          "Allium proliferum",              nil,  false, c_godet],
  ["Olivier de Bohême",             nil,                          "Elaeagnus angustifolia",         nil,  false, c_2l],
  ["Pêcher",                        "Fertile de Septembre",       "Prunus persica",                 nil,  false, c_2l],
  ["Plante cola",                   nil,                          "Artemisia abrotanum",            nil,  false, c_1l],
  ["Plaqueminier de Virginie",      "Supersweet",                 "Diospyros virginiana",           nil,  false, c_2l],
  ["Pluot",                         "Flavor Candy",               "Prunus salicina x armeniaca",    nil,  false, c_2l],
  ["Poireau perpétuel",             nil,                          "Allium ampeloprasum",            nil,  false, c_godet],
  ["Poirier",                       "Beurré Chaboceau",           "Pyrus communis",                 nil,  false, c_2l],
  ["Poirier",                       "Bronzée d'Enghien",         "Pyrus communis",                 nil,  false, c_2l],
  ["Poirier",                       "Comtesse de Paris",          "Pyrus communis",                 nil,  false, c_2l],
  ["Poirier",                       "Joséphine de Malines",      "Pyrus communis",                 nil,  false, c_2l],
  ["Poirier",                       "Légipont",                   "Pyrus communis",                 nil,  false, c_2l],
  ["Poirier",                       "Saint-Mathieu",              "Pyrus communis",                 nil,  false, c_2l],
  ["Poirier",                       "Triomphe de Vienne",         "Pyrus communis",                 nil,  false, c_2l],
  ["Poivrier du Sichuan",           nil,                          "Zanthoxylum simulans",           nil,  false, c_2l],
  ["Pommier",                       "Cwastresse Double",          "Malus domestica",                nil,  false, c_2l],
  ["Pommier",                       "Cwastresse Simple",          "Malus domestica",                nil,  false, c_2l],
  ["Pommier",                       "Gueule de Mouton",           "Malus domestica",                nil,  false, c_2l],
  ["Pommier",                       "Jacques Lebel",              "Malus domestica",                nil,  false, c_2l],
  ["Pommier",                       "Président Roulin",           "Malus domestica",                nil,  false, c_2l],
  ["Pommier",                       "Président Van Dievoet",      "Malus domestica",                nil,  false, c_2l],
  ["Pommier",                       "Reine des Reinettes",        "Malus domestica",                nil,  false, c_2l],
  ["Pommier",                       "Reinette Étoilée",           "Malus domestica",                nil,  false, c_2l],
  ["Pommier à chair rouge",         "Early Red Meat",             "Malus domestica",                nil,  false, c_2l],
  ["Prunier",                       "Belle de Thuin",             "Prunus domestica",               nil,  false, c_2l],
  ["Prunier",                       "Bubble Gum",                 "Prunus americana x salicina",    nil,  false, c_2l],
  ["Prunier",                       "Mirabelle de Nancy",         "Prunus domestica",               nil,  false, c_2l],
  ["Prunier",                       "Prune de Prince",            "Prunus domestica",               nil,  false, c_2l],
  ["Prunier",                       "Quetsche d'Alsace",          "Prunus domestica",               nil,  false, c_2l],
  ["Prunier",                       "Reine Claude Crottée",       "Prunus domestica",               nil,  false, c_2l],
  ["Prunier",                       "Reine Claude d'Oullins",     "Prunus domestica",               nil,  false, c_2l],
  ["Prunier",                       "Rivers Early Prolific",      "Prunus domestica",               nil,  false, c_2l],
  ["Prunier maritime",              "no. 2",                      "Prunus maritima",                nil,  false, c_2l],
  ["Prunier maritime",              "no. 5",                      "Prunus maritima",                nil,  false, c_2l],
  ["Ragouminier",                   "Snovit",                     "Prunus tomentosa",               nil,  false, c_2l],
  ["Ragouminier",                   nil,                          "Prunus tomentosa",               nil,  false, c_2l],
  ["Raisinier de Chine",            nil,                          "Hovenia dulcis",                 nil,  false, c_2l],
  ["Sorbier des oiseleurs",         "Rosina",                     "Sorbus aucuparia",               nil,  false, c_2l],
  ["Sorbier hybride",               "Burka",                      "Sorbus aucuparia x Sorbaronia",  nil,  false, c_2l],
  ["Sureau du Canada",              "Berry Hill",                 "Sambucus canadensis",            nil,  false, c_2l],
  ["Tilleul à petites feuilles",    nil,                          "Tilia cordata",                  nil,  false, c_2l],
].freeze

# ─── 4. SYNC ─────────────────────────────────────────────────────────────────
created_species  = 0
created_varieties = 0
created_batches  = 0
updated_batches  = 0
errors           = []

PRODUCTS.each do |common_name, variety_name, latin_name, price, available, container|
  # Find or create species
  species = Plant::Species.find_or_initialize_by(latin_name: latin_name)
  if species.new_record?
    species.assign_attributes(
      foliage_type:  "deciduous",
      growth_rate:   "medium",
      life_cycle:    "perennial",
      plant_type:    "shrub",
      fertility:     "self-fertile",
      fragrance:     "none",
      foliage_color: "green",
      soil_moisture: "moist",
      soil_richness: "moderate",
      watering_need: "3",
      common_names_fr: common_name
    )
    if species.save
      created_species += 1
    else
      errors << "Species #{latin_name}: #{species.errors.full_messages.join(', ')}"
      next
    end
  end

  # Find or create variety (if applicable)
  variety = nil
  if variety_name
    variety = Plant::Variety.find_or_initialize_by(latin_name: variety_name, species_id: species.id)
    if variety.new_record?
      variety.common_names_fr = [variety_name]
      if variety.save
        created_varieties += 1
      else
        errors << "Variety #{variety_name} for #{latin_name}: #{variety.errors.full_messages.join(', ')}"
      end
    end
  end

  # Determine status
  status = available ? "available" : "sold_out"

  # Find existing batch for this nursery + species + variety combination
  batch = Nursery::StockBatch.find_by(
    nursery_id:  nursery.id,
    species_id:  species.id,
    variety_id:  variety&.id,
    container_id: container.id,
    deleted_at:  nil
  )

  if batch
    # Update status and price if changed
    changed = false
    if batch.status != status
      batch.status = status
      changed = true
    end
    if price && batch.price_euros != price
      batch.price_euros = price
      changed = true
    end
    if changed
      batch.save!
      updated_batches += 1
    end
  else
    # Create new batch
    batch = Nursery::StockBatch.new(
      nursery_id:    nursery.id,
      species_id:    species.id,
      species_name:  species.latin_name,
      variety_id:    variety&.id,
      variety_name:  variety&.latin_name,
      container_id:  container.id,
      status:        status,
      price_euros:   price || 0.0,
      quantity:      0,
      available_quantity: 0,
      reserved_quantity:  0,
      notes:         "Source: arbustefruitier.com (sync #{Date.today})"
    )
    if batch.save
      created_batches += 1
    else
      errors << "Batch #{latin_name} #{variety_name}: #{batch.errors.full_messages.join(', ')}"
    end
  end
end

# ─── 5. SUMMARY ──────────────────────────────────────────────────────────────
puts ""
puts "=== Résultats ==="
puts "Nursery 'Arbuste Fruitier': #{nursery.id}"
puts "Espèces créées    : #{created_species}"
puts "Variétés créées   : #{created_varieties}"
puts "Lots créés        : #{created_batches}"
puts "Lots mis à jour   : #{updated_batches}"
puts "Erreurs           : #{errors.size}"
errors.each { |e| puts "  ⚠ #{e}" }
puts ""

available_count = Nursery::StockBatch.where(nursery_id: nursery.id, status: "available").count
sold_out_count  = Nursery::StockBatch.where(nursery_id: nursery.id, status: "sold_out").count
puts "État du catalogue Arbuste Fruitier dans Terranova:"
puts "  Disponibles  : #{available_count}"
puts "  Épuisés      : #{sold_out_count}"
puts "  Total lots   : #{available_count + sold_out_count}"
