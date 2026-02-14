# frozen_string_literal: true

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
]

members = members_data.map do |attrs|
  member = Member.find_or_initialize_by(email: attrs[:email])
  member.assign_attributes(attrs.except(:roles))
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
  record.event_type = "project_meeting"
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

Design::Expense.find_or_create_by!(project: design_project, date: Date.current - 2, description: 'Achat plants pepiniere') do |item|
  item.amount = 340.0
  item.category = 'plants'
  item.phase = 'projet-detaille'
  item.member_id = members.first.id.to_s
  item.member_name = "#{members.first.first_name} #{members.first.last_name}"
  item.receipt_url = 'https://example.com/receipts/plants-001.pdf'
  item.status = 'approved'
end

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
