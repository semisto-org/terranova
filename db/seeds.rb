# frozen_string_literal: true

# Seed event types
event_types_data = [
  { label: 'Réunion projet' },
  { label: 'Réunion porteurs' },
  { label: 'Design Day' },
  { label: 'Réunion guilde' },
  { label: 'Betting Table' },
  { label: 'Semisto Day' },
  { label: 'Semos Fest' },
  { label: 'Formation' },
]

event_types_data.each do |attrs|
  EventType.find_or_create_by!(label: attrs[:label])
end

members_data = [
  {
    first_name: "Sophie",
    last_name: "Dubois",
    email: "sophie.dubois@semisto.org",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
    status: "active",
    is_admin: true,
    joined_at: Date.new(2022, 3, 15),
    roles: %w[designer shaper],
    password: "terranova2026"
  },
  {
    first_name: "Thomas",
    last_name: "Martin",
    email: "thomas.martin@semisto.org",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas",
    status: "active",
    is_admin: false,
    joined_at: Date.new(2022, 6, 1),
    roles: %w[designer formateur],
    password: "terranova2026"
  },
  {
    first_name: "Marie",
    last_name: "Laurent",
    email: "marie.laurent@semisto.org",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marie",
    status: "active",
    is_admin: true,
    joined_at: Date.new(2021, 9, 10),
    roles: %w[comptable coordination],
    password: "terranova2026"
  }
  {
    first_name: "Beebopelula",
    last_name: "",
    email: "beebopelula@semisto.org",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Beebopelula",
    status: "active",
    is_admin: false,
    joined_at: Date.new(2025, 1, 1),
    roles: %w[IT],
    member_kind: "ai",
    password: "terranova2026"
  },
  {
    first_name: "Eddy",
    last_name: "",
    email: "eddy@semisto.org",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Eddy",
    status: "active",
    is_admin: false,
    joined_at: Date.new(2025, 1, 1),
    roles: %w[designer],
    member_kind: "ai",
    password: "terranova2026"
  },
  {
    first_name: "Lovely",
    last_name: "",
    email: "lovely@semisto.org",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Lovely",
    status: "active",
    is_admin: false,
    joined_at: Date.new(2025, 1, 1),
    roles: %w[IT],
    member_kind: "ai",
    password: "terranova2026"
  },
  {
    first_name: "Nova",
    last_name: "",
    email: "nova@semisto.org",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Nova",
    status: "active",
    is_admin: false,
    joined_at: Date.new(2025, 1, 1),
    roles: %w[coordination],
    member_kind: "ai",
    password: "terranova2026"
  }
]

members = members_data.map do |attrs|
  member = Member.find_or_initialize_by(email: attrs[:email])
  member.assign_attributes(attrs.except(:roles, :member_kind))
  member.member_kind = attrs[:member_kind] || "human"
  member.save!

  member.member_roles.delete_all
  attrs[:roles].each { |role| member.member_roles.create!(role: role) }

  Wallet.find_or_create_by!(member: member)
  member
end

it_guild = Guild.find_or_create_by!(name: "IT & Outils") do |guild|
  guild.description = "Developpement et maintenance des outils numeriques du Lab"
  guild.color = "blue"
  guild.leader = members.first
end

GuildMembership.find_or_create_by!(guild: it_guild, member: members.first)
GuildMembership.find_or_create_by!(guild: it_guild, member: members.second)

cycle = Cycle.find_or_create_by!(name: "Cycle Hiver 2025-2026") do |record|
  record.start_date = Date.new(2025, 12, 1)
  record.end_date = Date.new(2026, 1, 11)
  record.cooldown_start = Date.new(2026, 1, 12)
  record.cooldown_end = Date.new(2026, 1, 25)
  record.status = "active"
end

pitch = Pitch.find_or_create_by!(title: "Systeme de reservation des formations") do |record|
  record.status = "building"
  record.appetite = "6-weeks"
  record.author = members.first
  record.problem = "Les inscriptions sont gerees manuellement par email"
  record.solution = "Un flux de reservation en ligne"
  record.rabbit_holes = ["Ne pas integrer de paiement en ligne en V1"]
  record.no_gos = ["Pas d'integration tierce"]
end

bet = Bet.find_or_create_by!(pitch: pitch, cycle: cycle) do |record|
  record.status = "in_progress"
  record.placed_by = members.first
  record.placed_at = Time.current
end

members.take(2).each do |member|
  BetTeamMembership.find_or_create_by!(bet: bet, member: member)
end

scope = Scope.find_or_create_by!(pitch: pitch, name: "Catalogue & fiches formation") do |record|
  record.description = "Affichage du catalogue et des fiches"
  record.hill_position = 65
end

ScopeTask.find_or_create_by!(scope: scope, title: "Page catalogue") do |task|
  task.is_nice_to_have = false
  task.completed = true
end

IdeaList.find_or_create_by!(name: "Requests") do |record|
  record.description = "Demandes terrain"
end

IdeaList.find_or_create_by!(name: "Bugs") do |record|
  record.description = "Problemes detectes"
end

IdeaList.find_or_create_by!(name: "Ideas") do |record|
  record.description = "Nouvelles idees"
end

Event.find_or_create_by!(title: "Reunion de cycle") do |record|
  record.event_type = EventType.find_by!(label: "Réunion projet")
  record.start_date = Time.current.change(hour: 9, min: 0)
  record.end_date = Time.current.change(hour: 10, min: 0)
  record.location = "Lab Bruxelles"
  record.description = "Synchronisation hebdomadaire"
  record.cycle = cycle
end

SemosRate.find_or_create_by!(rate_type: "volunteer_hourly") do |rate|
  rate.amount = 10
  rate.description = "Valorisation horaire benevolat"
end

SemosRate.find_or_create_by!(rate_type: "cotisation_member_active") do |rate|
  rate.amount = 25
  rate.description = "Cotisation membre actif"
end

Timesheet.find_or_create_by!(member: members.first, date: Date.current, description: "Atelier design") do |record|
  record.hours = 3.5
  record.payment_type = "invoice"
  record.category = "design"
  record.invoiced = false
  record.kilometers = 12
end

# -----------------------------
# CRM Contacts
# -----------------------------

assoc_semisto = Contact.find_or_create_by!(name: "Association Semisto") do |c|
  c.contact_type = "organization"
  c.organization_type = "Association"
  c.email = "contact@semisto.org"
  c.phone = "+32 2 123 45 67"
  c.address = "Rue de la Station 62, 1050 Bruxelles"
  c.notes = "Collectif pilote du mouvement Semisto."
end
assoc_semisto.contact_tags.destroy_all
%w[partenaire client].each { |tag| assoc_semisto.contact_tags.find_or_create_by!(name: tag) }

contact_jean = Contact.find_or_create_by!(name: "Jean Dupont") do |c|
  c.contact_type = "person"
  c.email = "jean.dupont@example.com"
  c.phone = "+32 470 10 20 30"
  c.address = "Rue des Tilleuls 12, Namur"
  c.notes = "Client projet jardin-foret. Tres engage sur la biodiversite."
  c.organization = assoc_semisto
end
contact_jean.contact_tags.destroy_all
%w[client].each { |tag| contact_jean.contact_tags.find_or_create_by!(name: tag) }

Contact.find_or_create_by!(name: "Pepiniere Bruxelles") do |c|
  c.contact_type = "organization"
  c.organization_type = "Entreprise"
  c.email = "contact@pepiniere-bruxelles.be"
  c.phone = "+32 2 987 65 43"
  c.address = "Chaussee de Waterloo 1234, 1180 Bruxelles"
  c.notes = "Fournisseur plants et arbres fruitiers."
end.tap do |contact|
  contact.contact_tags.destroy_all
  contact.contact_tags.find_or_create_by!(name: "fournisseur")
end

Contact.find_or_create_by!(name: "Alice Martin") do |c|
  c.contact_type = "person"
  c.email = "alice.martin@example.com"
  c.phone = "+32 498 76 54 32"
  c.notes = "Interesse par les formations Academy."
end.tap do |contact|
  contact.contact_tags.destroy_all
  contact.contact_tags.find_or_create_by!(name: "partenaire")
end

# -----------------------------
# Milestone 3: Plant Database
# -----------------------------

contributor = Plant::Contributor.find_or_create_by!(name: 'Sophie Dubois') do |item|
  item.avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=SophiePlant'
  item.joined_at = Date.new(2024, 1, 10)
  item.lab_id = 'lab-bruxelles'
  item.species_created = 3
  item.varieties_created = 2
  item.photos_added = 12
  item.notes_written = 6
  item.semos_earned = 180
  item.activity_by_month = [2, 3, 4, 6, 8, 7, 5, 4, 6, 8, 9, 10]
end

malus = Plant::Genus.find_or_create_by!(latin_name: 'Malus') do |item|
  item.description = 'Genre regroupant les pommiers de la famille des Rosacees.'
end

corylus = Plant::Genus.find_or_create_by!(latin_name: 'Corylus') do |item|
  item.description = 'Genre des noisetiers, arbustes a chatons de la famille des Betulacees.'
end

malus_domestica = Plant::Species.find_or_create_by!(latin_name: 'Malus domestica') do |item|
  item.genus = malus
  item.plant_type = 'tree'
  item.edible_parts = ['fruit']
  item.interests = ['edible', 'pollinator', 'ornamental']
  item.ecosystem_needs = ['climax']
  item.propagation_methods = ['grafting', 'cutting']
  item.origin = 'Asie centrale'
  item.flower_colors = ['white', 'pink']
  item.planting_seasons = ['autumn', 'winter']
  item.harvest_months = ['aug', 'sep', 'oct']
  item.exposures = ['sun', 'partial-shade']
  item.hardiness = 'Zone 4 a 8'
  item.fruiting_months = ['aug', 'sep', 'oct']
  item.flowering_months = ['apr', 'may']
  item.foliage_type = 'deciduous'
  item.native_countries = ['fr', 'be', 'de']
  item.fertility = 'self-sterile'
  item.root_system = 'spreading'
  item.growth_rate = 'medium'
  item.forest_garden_zone = 'canopy'
  item.pollination_type = 'insect'
  item.soil_types = ['loam', 'clay', 'sandy']
  item.soil_moisture = 'moist'
  item.soil_richness = 'moderate'
  item.watering_need = '3'
  item.toxic_elements = 'Pepins (amygdaline en faible quantite)'
  item.is_invasive = false
  item.therapeutic_properties = 'Riche en fibres et antioxydants.'
  item.life_cycle = 'perennial'
  item.foliage_color = 'green'
  item.fragrance = 'light'
  item.transformations = ['jam', 'compote', 'juice', 'dried']
  item.fodder_qualities = ['pigs', 'sheep']
end

corylus_avellana = Plant::Species.find_or_create_by!(latin_name: 'Corylus avellana') do |item|
  item.genus = corylus
  item.plant_type = 'shrub'
  item.edible_parts = ['seed']
  item.interests = ['edible', 'hedge', 'pollinator']
  item.ecosystem_needs = ['pioneer']
  item.propagation_methods = ['layering', 'division']
  item.origin = 'Europe'
  item.flower_colors = ['green']
  item.planting_seasons = ['autumn', 'winter']
  item.harvest_months = ['sep', 'oct']
  item.exposures = ['sun', 'partial-shade']
  item.hardiness = 'Zone 5 a 8'
  item.fruiting_months = ['sep', 'oct']
  item.flowering_months = ['feb', 'mar']
  item.foliage_type = 'deciduous'
  item.native_countries = ['fr', 'be', 'de', 'nl']
  item.fertility = 'self-fertile'
  item.root_system = 'fibrous'
  item.growth_rate = 'medium'
  item.forest_garden_zone = 'edge'
  item.pollination_type = 'wind'
  item.soil_types = ['loam', 'chalky']
  item.soil_moisture = 'moist'
  item.soil_richness = 'moderate'
  item.watering_need = '2'
  item.is_invasive = false
  item.life_cycle = 'perennial'
  item.foliage_color = 'green'
  item.fragrance = 'none'
end

Plant::Variety.find_or_create_by!(latin_name: "Malus domestica 'Reine des Reinettes'") do |item|
  item.species = malus_domestica
  item.productivity = 'high'
  item.fruit_size = 'medium'
  item.taste_rating = 5
  item.storage_life = '2-3 months'
  item.maturity = 'late'
  item.disease_resistance = 'medium'
end

Plant::CommonName.find_or_create_by!(target_type: 'species', target_id: malus_domestica.id, language: 'fr', name: 'Pommier')
Plant::CommonName.find_or_create_by!(target_type: 'species', target_id: corylus_avellana.id, language: 'fr', name: 'Noisetier')

Plant::Reference.find_or_create_by!(target_type: 'species', target_id: malus_domestica.id, title: 'PFAF Malus domestica') do |item|
  item.reference_type = 'link'
  item.url = 'https://pfaf.org/user/Plant.aspx?LatinName=Malus+domestica'
  item.source = 'PFAF'
end

Plant::Photo.find_or_create_by!(target_type: 'species', target_id: malus_domestica.id, url: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce') do |item|
  item.caption = 'Pommes sur arbre'
  item.contributor = contributor
end

Plant::Note.find_or_create_by!(target_type: 'species', target_id: malus_domestica.id, contributor: contributor) do |item|
  item.content = 'Bonne adaptation au climat belge, attention a la tavelure en annees humides.'
  item.language = 'fr'
  item.photos = []
end

Plant::Location.find_or_create_by!(target_type: 'species', target_id: malus_domestica.id, latitude: 50.8503, longitude: 4.3517) do |item|
  item.place_name = 'Lab Bruxelles'
  item.lab_id = 'lab-bruxelles'
  item.is_mother_plant = true
  item.planted_year = 2020
  item.is_public = true
end

Plant::NurseryStock.find_or_create_by!(target_type: 'species', target_id: malus_domestica.id, nursery_id: 'nursery-brx') do |item|
  item.nursery_name = 'Pepiniere Bruxelles'
  item.quantity = 12
  item.rootstock = 'M106'
  item.age = '2 years'
  item.price = 24.5
end

Plant::ActivityItem.find_or_create_by!(activity_type: 'note_added', contributor: contributor, target_type: 'species', target_id: malus_domestica.id) do |item|
  item.target_name = malus_domestica.latin_name
  item.timestamp = Time.current
end

Plant::Palette.find_or_create_by!(name: 'Palette verger test', created_by: contributor.name) do |item|
  item.description = 'Premiere palette Milestone 3'
end

# -----------------------------
# Milestone 4: Design Studio
# -----------------------------

template_urban = Design::ProjectTemplate.find_or_create_by!(name: 'Verger urbain') do |item|
  item.description = 'Projet compact en zone urbaine avec production fruitiere intensive.'
  item.default_phases = %w[offre pre-projet projet-detaille]
  item.suggested_hours = 140
  item.suggested_budget = 7200
end

template_rural = Design::ProjectTemplate.find_or_create_by!(name: 'Agroforesterie rurale') do |item|
  item.description = 'Projet de plus grande echelle avec phases de mise en oeuvre longues.'
  item.default_phases = %w[offre pre-projet projet-detaille mise-en-oeuvre co-gestion]
  item.suggested_hours = 260
  item.suggested_budget = 18900
end

design_project = Design::Project.find_or_create_by!(name: 'Jardin-foret Dupont') do |item|
  item.client_id = 'client-dupont'
  item.client_name = 'Jean Dupont'
  item.client_email = 'jean.dupont@example.com'
  item.client_phone = '+32 470 10 20 30'
  item.place_id = 'place-dupont-namur'
  item.address = 'Rue des Tilleuls 12, Namur'
  item.latitude = 50.4669
  item.longitude = 4.8675
  item.area = 2400
  item.phase = 'projet-detaille'
  item.status = 'active'
  item.start_date = Date.new(2026, 1, 10)
  item.planting_date = Date.new(2026, 11, 15)
  item.project_manager_id = members.first.id.to_s
  item.template = template_urban
  item.hours_planned = 140
  item.hours_worked = 52
  item.hours_billed = 34
  item.hours_semos = 18
  item.expenses_budget = 7200
  item.expenses_actual = 2350
end

Design::ProjectMeeting.find_or_create_by!(project: design_project, title: 'Reunion lancement client') do |item|
  item.starts_at = 5.days.from_now.change(hour: 9, min: 30)
  item.duration_minutes = 90
  item.location = 'Visio'
end

Design::ProjectMeeting.find_or_create_by!(project: design_project, title: 'Atelier palette vegetale') do |item|
  item.starts_at = 11.days.from_now.change(hour: 14, min: 0)
  item.duration_minutes = 120
  item.location = 'Lab Bruxelles'
end

Design::TeamMember.find_or_create_by!(project: design_project, member_id: members.first.id.to_s, role: 'project-manager') do |item|
  item.member_name = "#{members.first.first_name} #{members.first.last_name}"
  item.member_email = members.first.email
  item.member_avatar = members.first.avatar
  item.is_paid = true
  item.assigned_at = 20.days.ago
end

Design::TeamMember.find_or_create_by!(project: design_project, member_id: members.second.id.to_s, role: 'designer') do |item|
  item.member_name = "#{members.second.first_name} #{members.second.last_name}"
  item.member_email = members.second.email
  item.member_avatar = members.second.avatar
  item.is_paid = true
  item.assigned_at = 15.days.ago
end

Design::ProjectTimesheet.find_or_create_by!(project: design_project, member_id: members.first.id.to_s, date: Date.current - 3) do |item|
  item.member_name = "#{members.first.first_name} #{members.first.last_name}"
  item.hours = 4.5
  item.phase = 'projet-detaille'
  item.mode = 'billed'
  item.travel_km = 8
  item.notes = 'Atelier client et mise a jour concept.'
end

# Design::Expense model not yet created — skip seeding
# Design::Expense.find_or_create_by!(project: design_project, date: Date.current - 2, description: 'Achat plants pepiniere') do |item|
#   item.amount = 340.0
#   item.category = 'plants'
#   item.phase = 'projet-detaille'
#   item.member_id = members.first.id.to_s
#   item.member_name = "#{members.first.first_name} #{members.first.last_name}"
#   item.receipt_url = 'https://example.com/receipts/plants-001.pdf'
#   item.status = 'approved'
# end

analysis = Design::SiteAnalysis.find_or_create_by!(project: design_project)
analysis.update!(
  climate: { hardinessZone: 'H7', annualRainfall: 820, notes: 'Zone temperee humide' },
  geomorphology: { slope: 'leger', aspect: 'sud-est', elevation: 180 },
  water: { sources: ['pluie', 'reseau'], wetZones: 'fond parcelle', drainage: 'modere' },
  socio_economic: { ownership: 'prive', neighbors: 'zone residentielle' },
  access_data: { mainAccess: 'portail est', parking: '2 vehicules' },
  vegetation: { existingTrees: ['Pommier', 'Noisetier'], notableFeatures: 'haie mature' },
  microclimate: { windExposure: 'modere', sunPatterns: 'plein soleil sud' },
  buildings: { existing: ['abri jardin'], utilities: 'eau + electricite' },
  soil: { type: 'limono-argileux', ph: 6.8, texture: 'friable' },
  client_observations: { favoriteSpots: 'terrasse sud', historyNotes: 'ancien potager' },
  client_photos: [],
  client_usage_map: []
)

design_palette = Design::ProjectPalette.find_or_create_by!(project: design_project)
Design::ProjectPaletteItem.find_or_create_by!(palette: design_palette, species_id: malus_domestica.id.to_s, layer: 'canopy') do |item|
  item.species_name = malus_domestica.latin_name
  item.common_name = 'Pommier'
  item.quantity = 4
  item.unit_price = 28
  item.notes = 'Varietes anciennes'
  item.harvest_months = [8, 9, 10]
  item.harvest_products = ['fruits']
end

# -----------------------------
# Milestone 5: Academy
# -----------------------------

academy_type = Academy::TrainingType.find_or_create_by!(name: 'Design de foret-jardin') do |item|
  item.description = 'Formation complete au design de forets-jardins et forets nouricieres.'
  item.checklist_template = ['Programme valide', 'Salle confirmee', 'Formateurs confirmes', 'Supports envoyes']
end

Academy::TrainingType.find_or_create_by!(name: 'Initiation permaculture') do |item|
  item.description = 'Decouverte des principes de la permaculture appliquee.'
  item.checklist_template = ['Programme valide', 'Lieu confirme', 'Materiel prepare']
end

# Notion training types
%w[
  Formation\ service\ public
  Formation\ pour\ entreprises
  Formation\ pour\ groupe\ privé
  Formation\ pro
  Formation\ pour\ le\ grand\ public
  Conférence
  Visite
  Cursus
  Formation\ pour\ partenaire
].each do |type_name|
  Academy::TrainingType.find_or_create_by!(name: type_name) do |item|
    item.description = ""
    item.checklist_template = []
  end
end

loc_quatre_sources = Academy::TrainingLocation.find_or_create_by!(name: 'Les 4 Sources') do |item|
  item.address = "Fonds d'Ahinvaux 1, 5530 Yvoir"
  item.capacity = 50
  item.description = "Centre de formation en pleine nature, au coeur de la vallee du Bocq. Salles de cours, ateliers pratiques en exterieur et hebergement sur place."
  item.has_accommodation = true
  item.latitude = 50.3267
  item.longitude = 4.8789
end

loc_queue_pelle = Academy::TrainingLocation.find_or_create_by!(name: 'Queue de Pelle') do |item|
  item.address = 'Chaumont-Gistoux'
  item.capacity = 30
  item.description = "Ferme pedagogique avec jardin-foret de demonstration. Ideal pour formations pratiques en petit groupe."
  item.has_accommodation = false
  item.latitude = 50.6833
  item.longitude = 4.6833
end

Academy::TrainingLocation.find_or_create_by!(name: 'Lab Bruxelles') do |item|
  item.address = 'Rue de la Station 62, 1050 Ixelles'
  item.capacity = 25
  item.description = "Espace de coworking et formation au coeur de Bruxelles. Equipement multimedia, cuisine partagee."
  item.has_accommodation = false
  item.latitude = 50.8340
  item.longitude = 4.3680
end

Academy::TrainingLocation.find_or_create_by!(name: 'Ferme du Hayon') do |item|
  item.address = 'Rue du Hayon 4, 6830 Bouillon'
  item.capacity = 40
  item.description = "Domaine forestier en Gaume avec salle de formation, verger conservatoire et foret comestible."
  item.has_accommodation = true
  item.latitude = 49.7933
  item.longitude = 5.0667
end

training_dj = Academy::Training.find_or_create_by!(title: 'Design foret-jardin - Session printemps 2026') do |item|
  item.training_type = academy_type
  item.status = 'registrations_open'
  item.price = 280
  item.max_participants = 20
  item.requires_accommodation = true
  item.description = 'Formation intensive de 5 jours au design de forets-jardins.'
  item.coordinator_note = 'Prevoir materiel de terrain.'
  item.checklist_items = academy_type.checklist_template
  item.checked_items = [0, 1]
end

Academy::TrainingSession.find_or_create_by!(training: training_dj, start_date: Date.new(2026, 4, 6)) do |item|
  item.end_date = Date.new(2026, 4, 10)
  item.description = 'Semaine complete de formation'
  item.location_ids = [loc_quatre_sources.id.to_s]
  item.trainer_ids = [members.second.id.to_s]
  item.assistant_ids = []
end

# ──────────────────────────────────────────────
# Nursery Seeds
# ──────────────────────────────────────────────
puts "Seeding nursery data..."

nursery_semisto = Nursery::Nursery.find_or_create_by!(name: 'Pépinière Semisto') do |n|
  n.nursery_type = 'semisto'
  n.integration = 'platform'
  n.address = 'Rue de la Forêt 42'
  n.city = 'Namur'
  n.postal_code = '5000'
  n.country = 'BE'
  n.latitude = 50.4674
  n.longitude = 4.8720
  n.contact_name = 'Sophie Dubois'
  n.contact_email = 'sophie@semisto.org'
  n.contact_phone = '+32 81 12 34 56'
  n.description = 'Pépinière principale du réseau Semisto'
  n.specialties = ['fruitiers', 'haies', 'couvre-sol']
  n.is_pickup_point = true
end

nursery_partner = Nursery::Nursery.find_or_create_by!(name: 'Pépinière du Bocage') do |n|
  n.nursery_type = 'partner'
  n.integration = 'manual'
  n.address = 'Chemin du Bocage 15'
  n.city = 'Liège'
  n.postal_code = '4000'
  n.country = 'BE'
  n.latitude = 50.6326
  n.longitude = 5.5797
  n.contact_name = 'Marc Lefort'
  n.contact_email = 'marc@bocage.be'
  n.contact_phone = '+32 4 987 65 43'
  n.website = 'https://pepiniere-bocage.be'
  n.description = 'Pépinière partenaire spécialisée en arbres forestiers'
  n.specialties = ['forestiers', 'fruitiers']
  n.is_pickup_point = true
end

nursery_third = Nursery::Nursery.find_or_create_by!(name: 'Les Jardins de Wallonie') do |n|
  n.nursery_type = 'partner'
  n.integration = 'platform'
  n.address = 'Avenue Verte 8'
  n.city = 'Mons'
  n.postal_code = '7000'
  n.country = 'BE'
  n.latitude = 50.4542
  n.longitude = 3.9563
  n.contact_name = 'Isabelle Martin'
  n.contact_email = 'isabelle@jardins-wallonie.be'
  n.description = 'Spécialiste plantes médicinales et aromatiques'
  n.specialties = ['médicinales', 'aromatiques']
  n.is_pickup_point = false
end

# Containers
container_p9 = Nursery::Container.find_or_create_by!(short_name: 'P9') do |c|
  c.name = 'Pot 9cm'
  c.volume_liters = 0.5
  c.description = 'Petit pot standard 9cm'
  c.sort_order = 1
end

container_c2 = Nursery::Container.find_or_create_by!(short_name: 'C2') do |c|
  c.name = 'Conteneur 2L'
  c.volume_liters = 2.0
  c.description = 'Conteneur moyen 2 litres'
  c.sort_order = 2
end

container_c5 = Nursery::Container.find_or_create_by!(short_name: 'C5') do |c|
  c.name = 'Conteneur 5L'
  c.volume_liters = 5.0
  c.description = 'Grand conteneur 5 litres'
  c.sort_order = 3
end

container_rn = Nursery::Container.find_or_create_by!(short_name: 'RN') do |c|
  c.name = 'Racines nues'
  c.volume_liters = nil
  c.description = 'Plants à racines nues (saison hivernale)'
  c.sort_order = 4
end

# Stock Batches
batch1 = Nursery::StockBatch.find_or_create_by!(nursery: nursery_semisto, species_name: 'Malus domestica', container: container_c2) do |b|
  b.species_id = 'sp-malus-domestica'
  b.variety_name = 'Reine des Reinettes'
  b.variety_id = 'var-reine-reinettes'
  b.quantity = 50
  b.available_quantity = 42
  b.reserved_quantity = 8
  b.sowing_date = Date.new(2025, 3, 15)
  b.origin = 'Greffage local'
  b.growth_stage = 'young'
  b.price_euros = 12.50
  b.accepts_semos = true
  b.price_semos = 25.0
  b.notes = 'Greffés sur M26, bon développement'
end

batch2 = Nursery::StockBatch.find_or_create_by!(nursery: nursery_semisto, species_name: 'Corylus avellana', container: container_rn) do |b|
  b.species_id = 'sp-corylus-avellana'
  b.variety_name = 'Merveille de Bollwiller'
  b.variety_id = 'var-bollwiller'
  b.quantity = 120
  b.available_quantity = 95
  b.reserved_quantity = 25
  b.sowing_date = Date.new(2024, 11, 1)
  b.origin = 'Marcottage'
  b.growth_stage = 'established'
  b.price_euros = 8.00
  b.accepts_semos = true
  b.price_semos = 16.0
end

batch3 = Nursery::StockBatch.find_or_create_by!(nursery: nursery_partner, species_name: 'Quercus robur', container: container_c5) do |b|
  b.species_id = 'sp-quercus-robur'
  b.quantity = 30
  b.available_quantity = 5
  b.reserved_quantity = 0
  b.sowing_date = Date.new(2024, 10, 20)
  b.origin = 'Semis'
  b.growth_stage = 'young'
  b.price_euros = 18.00
  b.accepts_semos = false
  b.notes = 'Stock bas - réappro prévue mars 2026'
end

batch4 = Nursery::StockBatch.find_or_create_by!(nursery: nursery_third, species_name: 'Lavandula angustifolia', container: container_p9) do |b|
  b.species_id = 'sp-lavandula'
  b.variety_name = 'Hidcote'
  b.variety_id = 'var-hidcote'
  b.quantity = 200
  b.available_quantity = 180
  b.reserved_quantity = 20
  b.sowing_date = Date.new(2025, 5, 1)
  b.origin = 'Bouturage'
  b.growth_stage = 'seedling'
  b.price_euros = 3.50
  b.accepts_semos = true
  b.price_semos = 7.0
end

batch5 = Nursery::StockBatch.find_or_create_by!(nursery: nursery_semisto, species_name: 'Rubus idaeus', container: container_p9) do |b|
  b.species_id = 'sp-rubus-idaeus'
  b.variety_name = 'Heritage'
  b.variety_id = 'var-heritage'
  b.quantity = 80
  b.available_quantity = 3
  b.reserved_quantity = 2
  b.sowing_date = Date.new(2025, 6, 10)
  b.origin = 'Division'
  b.growth_stage = 'mature'
  b.price_euros = 5.00
  b.accepts_semos = true
  b.price_semos = 10.0
  b.notes = 'Framboisier remontant, excellent rendement'
end

# Mother Plants
Nursery::MotherPlant.find_or_create_by!(species_name: 'Malus domestica', place_name: 'Verger communautaire Namur') do |mp|
  mp.species_id = 'sp-malus-domestica'
  mp.variety_name = 'Reine des Reinettes'
  mp.variety_id = 'var-reine-reinettes'
  mp.place_id = 'place-verger-namur'
  mp.place_address = 'Chemin du Verger, 5000 Namur'
  mp.planting_date = Date.new(2018, 3, 15)
  mp.source = 'design-studio'
  mp.project_name = 'Verger Namur Nord'
  mp.project_id = 'proj-verger-namur'
  mp.status = 'validated'
  mp.validated_at = Time.new(2025, 6, 1)
  mp.validated_by = 'Sophie Dubois'
  mp.quantity = 3
  mp.notes = 'Arbres vigoureux, bonne production'
  mp.last_harvest_date = Date.new(2025, 10, 15)
end

Nursery::MotherPlant.find_or_create_by!(species_name: 'Sambucus nigra', place_name: 'Jardin partagé Liège') do |mp|
  mp.species_id = 'sp-sambucus-nigra'
  mp.place_id = 'place-jardin-liege'
  mp.place_address = 'Rue des Jardins, 4000 Liège'
  mp.planting_date = Date.new(2020, 11, 10)
  mp.source = 'member-proposal'
  mp.member_name = 'Pierre Lambert'
  mp.member_id = 'member-pierre'
  mp.status = 'pending'
  mp.quantity = 2
  mp.notes = 'Sureau adulte, proposition de récolte de boutures'
end

Nursery::MotherPlant.find_or_create_by!(species_name: 'Ribes nigrum', place_name: 'Potager collectif Mons') do |mp|
  mp.species_id = 'sp-ribes-nigrum'
  mp.variety_name = 'Noir de Bourgogne'
  mp.variety_id = 'var-noir-bourgogne'
  mp.place_id = 'place-potager-mons'
  mp.place_address = 'Avenue du Potager, 7000 Mons'
  mp.planting_date = Date.new(2021, 2, 20)
  mp.source = 'member-proposal'
  mp.member_name = 'Claire Fontaine'
  mp.member_id = 'member-claire'
  mp.status = 'pending'
  mp.quantity = 5
end

Nursery::MotherPlant.find_or_create_by!(species_name: 'Prunus avium', place_name: 'Parc Josaphat') do |mp|
  mp.species_id = 'sp-prunus-avium'
  mp.variety_name = 'Burlat'
  mp.variety_id = 'var-burlat'
  mp.place_id = 'place-josaphat'
  mp.place_address = 'Parc Josaphat, 1030 Bruxelles'
  mp.planting_date = Date.new(2015, 4, 1)
  mp.source = 'design-studio'
  mp.project_name = 'Parc comestible Josaphat'
  mp.project_id = 'proj-josaphat'
  mp.status = 'rejected'
  mp.validated_at = Time.new(2025, 8, 15)
  mp.validated_by = 'Sophie Dubois'
  mp.quantity = 1
  mp.notes = 'Arbre malade, rejeté pour récolte'
end

# Orders
order1 = Nursery::Order.find_or_create_by!(order_number: 'PEP-2026-0001') do |o|
  o.customer_name = 'Association Les Vergers Urbains'
  o.customer_email = 'contact@vergers-urbains.be'
  o.customer_phone = '+32 2 345 67 89'
  o.customer_id = 'cust-vergers-urbains'
  o.is_member = true
  o.status = 'new'
  o.price_level = 'standard'
  o.pickup_nursery = nursery_semisto
  o.subtotal_euros = 125.0
  o.subtotal_semos = 0
  o.total_euros = 125.0
  o.total_semos = 0
  o.notes = 'Commande pour plantation printemps 2026'
end

Nursery::OrderLine.find_or_create_by!(order: order1, stock_batch: batch1, species_name: 'Malus domestica') do |l|
  l.nursery = nursery_semisto
  l.nursery_name = nursery_semisto.name
  l.variety_name = 'Reine des Reinettes'
  l.container_name = 'C2'
  l.quantity = 10
  l.unit_price_euros = 12.50
  l.total_euros = 125.0
  l.total_semos = 0
  l.pay_in_semos = false
end

order2 = Nursery::Order.find_or_create_by!(order_number: 'PEP-2026-0002') do |o|
  o.customer_name = 'Pierre Lambert'
  o.customer_email = 'pierre.lambert@email.be'
  o.customer_id = 'member-pierre'
  o.is_member = true
  o.status = 'processing'
  o.price_level = 'solidarity'
  o.pickup_nursery = nursery_semisto
  o.subtotal_euros = 0
  o.subtotal_semos = 250.0
  o.total_euros = 0
  o.total_semos = 250.0
  o.prepared_at = Time.new(2026, 2, 15)
  o.notes = 'Paiement en semos'
end

Nursery::OrderLine.find_or_create_by!(order: order2, stock_batch: batch2, species_name: 'Corylus avellana') do |l|
  l.nursery = nursery_semisto
  l.nursery_name = nursery_semisto.name
  l.variety_name = 'Merveille de Bollwiller'
  l.container_name = 'RN'
  l.quantity = 10
  l.unit_price_euros = 8.00
  l.unit_price_semos = 16.0
  l.total_euros = 0
  l.total_semos = 160.0
  l.pay_in_semos = true
end

Nursery::OrderLine.find_or_create_by!(order: order2, stock_batch: batch4, species_name: 'Lavandula angustifolia') do |l|
  l.nursery = nursery_third
  l.nursery_name = nursery_third.name
  l.variety_name = 'Hidcote'
  l.container_name = 'P9'
  l.quantity = 10
  l.unit_price_euros = 3.50
  l.unit_price_semos = 7.0
  l.total_euros = 0
  l.total_semos = 70.0
  l.pay_in_semos = true
end

order3 = Nursery::Order.find_or_create_by!(order_number: 'PEP-2026-0003') do |o|
  o.customer_name = 'Commune de Gembloux'
  o.customer_email = 'espaces-verts@gembloux.be'
  o.customer_id = 'cust-gembloux'
  o.is_member = false
  o.status = 'ready'
  o.price_level = 'support'
  o.pickup_nursery = nursery_partner
  o.subtotal_euros = 540.0
  o.subtotal_semos = 0
  o.total_euros = 540.0
  o.total_semos = 0
  o.prepared_at = Time.new(2026, 2, 10)
  o.ready_at = Time.new(2026, 2, 18)
end

Nursery::OrderLine.find_or_create_by!(order: order3, stock_batch: batch3, species_name: 'Quercus robur') do |l|
  l.nursery = nursery_partner
  l.nursery_name = nursery_partner.name
  l.container_name = 'C5'
  l.quantity = 30
  l.unit_price_euros = 18.00
  l.total_euros = 540.0
  l.total_semos = 0
  l.pay_in_semos = false
end

# Transfers
Nursery::Transfer.find_or_create_by!(order: order2, status: 'planned') do |t|
  t.stops = [
    { nurseryId: nursery_third.id.to_s, nurseryName: nursery_third.name, type: 'pickup', address: nursery_third.address },
    { nurseryId: nursery_semisto.id.to_s, nurseryName: nursery_semisto.name, type: 'delivery', address: nursery_semisto.address }
  ]
  t.total_distance_km = 85.0
  t.estimated_duration = '1h30'
  t.scheduled_date = Date.new(2026, 2, 25)
  t.notes = 'Transfert lavandes de Mons vers Namur'
end

Nursery::Transfer.find_or_create_by!(order: order3, status: 'in-progress') do |t|
  t.stops = [
    { nurseryId: nursery_partner.id.to_s, nurseryName: nursery_partner.name, type: 'pickup', address: nursery_partner.address }
  ]
  t.total_distance_km = 45.0
  t.estimated_duration = '45min'
  t.driver_name = 'Jean-Marc Dupont'
  t.vehicle_info = 'Camionnette Semisto - 1-ABC-234'
  t.scheduled_date = Date.new(2026, 2, 19)
  t.notes = 'Livraison chênes pour Gembloux'
end

puts "Nursery seeding done!"

# ─── Knowledge Base ───
puts "Seeding Knowledge Base..."

# Sections
section_reglementation = KnowledgeSection.find_or_create_by!(name: "Réglementation") do |s|
  s.description = "Articles liés à la réglementation et au cadre légal"
  s.position = 1
end

section_financement = KnowledgeSection.find_or_create_by!(name: "Financement") do |s|
  s.description = "Opportunités de financement et subventions"
  s.position = 2
end

section_technique = KnowledgeSection.find_or_create_by!(name: "Technique") do |s|
  s.description = "Guides techniques et méthodologiques"
  s.position = 3
end

# Topics
knowledge_topics = [
  {
    title: "Éco-régimes PAC et opportunités pour l'agroforesterie",
    content: "## Contexte\n\nLa nouvelle PAC 2023-2027 introduit les éco-régimes, un outil majeur pour rémunérer les pratiques agricoles bénéfiques.\n\n## Points clés\n\n- Les éco-régimes représentent **25% du budget** des aides directes\n- L'agroforesterie est éligible au niveau 2 (premium)\n- Les haies et alignements d'arbres sont valorisés\n\n## Implications pour Semisto\n\nCette évolution réglementaire ouvre des opportunités de financement pour les projets de forêts-jardins intégrés aux exploitations agricoles.",
    tags: ["PAC", "agroforesterie", "financement"],
    section: section_reglementation,
    pinned: true,
    status: "published",
    author_name: "Sophie Dubois"
  },
  {
    title: "Programme LIFE : financement européen pour la biodiversité",
    content: "## Le programme LIFE\n\nLIFE est l'instrument financier de l'UE pour l'environnement et l'action climatique.\n\n## Budget 2021-2027\n\n- Budget total : **5,4 milliards €**\n- Sous-programme Nature et Biodiversité\n- Taux de cofinancement : 60-75%\n\n## Éligibilité Semisto\n\nLes projets de restauration écologique et de création de forêts-jardins peuvent être éligibles, notamment via :\n- Projets standard d'action\n- Projets intégrés stratégiques\n\n## Calendrier\n\nAppels à projets annuels, généralement en avril-mai.",
    tags: ["LIFE", "EU", "biodiversité", "financement"],
    section: section_financement,
    pinned: false,
    status: "published",
    author_name: "Marc Lecomte"
  },
  {
    title: "Les 7 strates de la forêt-jardin : guide technique",
    content: "## Introduction\n\nLa forêt-jardin s'organise en 7 strates verticales, mimant la structure d'une forêt naturelle.\n\n## Les 7 strates\n\n1. **Canopée** — Grands arbres fruitiers et à noix (noyers, châtaigniers)\n2. **Petit arbre** — Fruitiers de taille moyenne (pommiers, poiriers)\n3. **Arbuste** — Petits fruits (groseilliers, cassissiers, noisetiers)\n4. **Herbacée** — Plantes vivaces comestibles (consoude, oseille)\n5. **Couvre-sol** — Plantes rampantes (fraisiers, thym)\n6. **Grimpante** — Lianes (kiwi, vigne, houblon)\n7. **Rhizosphère** — Racines et tubercules (topinambour, oca du Pérou)\n\n## Principes de design\n\n- Respecter les besoins en lumière de chaque strate\n- Planifier la succession temporelle\n- Intégrer les fixateurs d'azote à chaque niveau",
    tags: ["strates", "design", "forêt-jardin", "technique"],
    section: section_technique,
    pinned: false,
    status: "published",
    author_name: "Sophie Dubois"
  },
  {
    title: "Stratégie réseau multi-pays Semisto 2026-2030",
    content: "## Vision\n\nDéployer le modèle Semisto dans 5 pays européens d'ici 2030.\n\n## Pays cibles\n\n- **Belgique** (base) — 10 labs actifs\n- **France** — Partenariat avec le réseau des AMAP\n- **Pays-Bas** — Collaboration avec Voedselbosbouw\n- **Portugal** — Projets de reforestation comestible\n- **Allemagne** — Lien avec le mouvement Permakultur\n\n## Modèle de déploiement\n\n1. Identifier un porteur local\n2. Former via Academy\n3. Accompagner le premier design\n4. Autonomisation progressive\n\n## Indicateurs\n\n- Nombre de labs actifs par pays\n- Hectares en transition\n- Communauté de praticiens",
    tags: ["réseau", "expansion", "Europe", "stratégie"],
    section: nil,
    pinned: true,
    status: "published",
    author_name: "Marc Lecomte"
  },
  {
    title: "Variétés fruitières locales wallonnes : inventaire et potentiel",
    content: "## Patrimoine variétal wallon\n\nLa Wallonie possède un patrimoine remarquable de variétés fruitières anciennes, adaptées au terroir local.\n\n## Espèces principales\n\n### Pommiers\n- Reinette de Blenheim\n- Belle-Fleur de Brabant\n- Cwastresse double\n- President Roulin\n\n### Poiriers\n- Beurré d'Hardenpont\n- Calebasse à la Reine\n- Double Philippe\n\n### Pruniers\n- Sainte-Catherine\n- Altesse de Namur\n\n## Intérêt pour les forêts-jardins\n\n- Adaptation au climat local\n- Résistance aux maladies\n- Conservation de la biodiversité cultivée\n- Valorisation en circuits courts",
    tags: ["variétés locales", "Wallonie", "fruitiers", "biodiversité"],
    section: section_technique,
    pinned: false,
    status: "published",
    author_name: "Isabelle Martin"
  },
  {
    title: "Note : réglementation urbanisme et forêts comestibles",
    content: "## Problématique\n\nLa plantation d'arbres fruitiers et forestiers en milieu péri-urbain soulève des questions réglementaires.\n\n## Points d'attention\n\n- Distances de plantation par rapport aux limites de propriété\n- Permis d'urbanisme pour aménagements paysagers\n- Réglementation sur les haies et clôtures\n- Accès public et responsabilité\n\n## Recommandations\n\nToujours consulter le service urbanisme communal avant de lancer un projet. Documenter les démarches pour créer un guide réutilisable.",
    tags: ["urbanisme", "réglementation", "plantation"],
    section: section_reglementation,
    pinned: false,
    status: "draft",
    author_name: "Sophie Dubois"
  }
]

knowledge_topics.each do |attrs|
  KnowledgeTopic.find_or_create_by!(title: attrs[:title]) do |t|
    t.content = attrs[:content]
    t.tags = attrs[:tags]
    t.section = attrs[:section]
    t.pinned = attrs[:pinned]
    t.status = attrs[:status]
    t.author_name = attrs[:author_name]
  end
end

# Seed some comments
first_topic = KnowledgeTopic.find_by(title: "Éco-régimes PAC et opportunités pour l'agroforesterie")
if first_topic && first_topic.comments.empty?
  first_topic.comments.create!(content: "Très intéressant, merci pour ce résumé !", author_name: "Marc Lecomte")
  first_topic.comments.create!(content: "Est-ce que quelqu'un a déjà fait une demande pour le niveau 2 ?", author_name: "Isabelle Martin")
end

puts "Knowledge Base seeding done!"
