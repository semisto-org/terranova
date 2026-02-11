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
    roles: %w[designer shaper]
  },
  {
    first_name: "Thomas",
    last_name: "Martin",
    email: "thomas.martin@semisto.org",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas",
    status: "active",
    is_admin: false,
    joined_at: Date.new(2022, 6, 1),
    roles: %w[designer formateur]
  },
  {
    first_name: "Marie",
    last_name: "Laurent",
    email: "marie.laurent@semisto.org",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marie",
    status: "active",
    is_admin: true,
    joined_at: Date.new(2021, 9, 10),
    roles: %w[comptable coordination]
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
