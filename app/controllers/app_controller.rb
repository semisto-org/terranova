class AppController < ApplicationController
  before_action :require_authentication, except: [:design_client_portal, :academy_registration, :public_catalog, :public_species_page]
  before_action :verify_client_portal_token!, only: [:design_client_portal]
  before_action :require_effective_for_strategy, only: [:strategy]

  def index
    render inertia: "Home/Index", props: {
      milestone: "Home"
    }
  end

  def lab
    render inertia: "Lab/Index", props: {
      milestone: "Lab Management",
      currentMemberId: current_member.id.to_s,
      stats: {
        members: Member.count,
        pitches: Pitch.count,
        bets: Bet.count,
        events: Event.count,
        wallets: Wallet.count,
        timesheets: Timesheet.count
      }
    }
  end

  def projects
    render inertia: "Projects/Index", props: {
      milestone: "Projects",
      initialType: params[:type],
      initialId: params[:id]
    }
  end

  def plants
    render inertia: "Plants/Index", props: {
      milestone: "Plant Database",
      currentContributorId: Plant::Contributor.order(:id).pick(:id)&.to_s,
      initialPaletteId: params[:palette_id].presence || Plant::Palette.order(:id).pick(:id)&.to_s
    }
  end

  def design
    render inertia: "Design/Index", props: {
      milestone: "Design Studio",
      initialProjectId: nil
    }
  end

  def academy
    render inertia: "Academy/Index", props: {
      milestone: "Academy",
      initialTrainingId: nil
    }
  end

  def academy_training
    render inertia: "Academy/Index", props: {
      milestone: "Academy",
      initialTrainingId: params[:training_id].to_s
    }
  end

  def academy_registration
    render inertia: "Academy/Registration", props: {
      milestone: "Academy",
      trainingId: params[:training_id].to_s,
      stripePublicKey: ENV.fetch("STRIPE_PUBLISHABLE_KEY", "")
    }
  end

  def academy_training_type_form
    render inertia: "Academy/TrainingTypeForm", props: {
      milestone: "Academy",
      trainingTypeId: params[:id]
    }
  end

  def academy_location_form
    render inertia: "Academy/LocationForm", props: {
      milestone: "Academy",
      locationId: params[:id]
    }
  end

  def nursery
    render inertia: "Nursery/Index", props: {
      milestone: "Nursery"
    }
  end

  def public_catalog
    render inertia: "Public/Catalog", props: {
      milestone: "Public Catalog"
    }
  end

  def public_species_page
    slug = params[:slug].to_s.downcase
    species = Plant::Species.where("lower(replace(latin_name, ' ', '-')) = ?", slug).first
    raise ActiveRecord::RecordNotFound unless species

    render inertia: 'Plants/PublicSpecies', props: {
      species: serialize_public_species_full(species),
      photos: photos_for_species(species),
      commonNames: common_names_for_species(species),
      varieties: species.varieties.order(:latin_name).map { |v|
        { id: v.id.to_s, latinName: v.latin_name, additionalNotes: v.additional_notes.presence }
      },
      genus: species.genus ? { id: species.genus.id.to_s, latinName: species.genus.latin_name } : nil,
      isAdmin: !!current_member
    }
  end

  def design_project
    render inertia: "Design/Index", props: {
      milestone: "Design Studio",
      initialProjectId: params[:project_id].to_s
    }
  end

  def design_client_portal
    render inertia: "Design/ClientPortal", props: {
      milestone: "Design Studio Client Portal",
      initialProjectId: params[:project_id].to_s
    }
  end

  def knowledge
    render inertia: "Knowledge/Index", props: {
      milestone: "Knowledge Base"
    }
  end

  def strategy
    render inertia: "Strategy/Index", props: {
      milestone: "Strategy"
    }
  end

  def marketplace
    render inertia: "Marketplace/Index", props: {
      milestone: "Marketplace Semos"
    }
  end

  def admin
    return redirect_to root_path, alert: "Accès non autorisé" unless current_member.is_admin
    render inertia: "Admin/Settings", props: {
      milestone: "Administration",
      currentMemberId: current_member.id.to_s
    }
  end

  def parametres
    return redirect_to root_path, alert: "Accès non autorisé" unless current_member.is_admin
    render inertia: "Admin/Parametres", props: {
      milestone: "Paramètres"
    }
  end

  def guilds
    render inertia: "Guilds/Index", props: {
      milestone: "Guilds"
    }
  end

  def profile
    render inertia: "Profile/Index", props: {
      milestone: "Profile"
    }
  end

  def design_system
    render inertia: "DesignSystem", props: {
      milestone: "Design System"
    }
  end

  def fallback
    path = params[:path] || ''
    case path
    when /\Aadmin(\/|\z)/
      admin
    when /\Aparametres(\/|\z)/
      parametres
    when /\Alab(\/|\z)/
      lab
    when /\Adesign\/([^\/]+)/
      params[:project_id] = $1
      design_project
    when /\Adesign(\/|\z)/
      design
    when /\Aacademy\/training-types\/new/
      academy_training_type_form
    when /\Aacademy\/training-types\/([^\/]+)\/edit/
      params[:id] = $1
      academy_training_type_form
    when /\Aacademy\/locations\/new/
      academy_location_form
    when /\Aacademy\/locations\/([^\/]+)\/edit/
      params[:id] = $1
      academy_location_form
    when /\Aacademy\/([^\/]+)\/register/
      params[:training_id] = $1
      academy_registration
    when /\Aacademy\/([^\/]+)/
      params[:training_id] = $1
      academy_training
    when /\Aacademy(\/|\z)/
      academy
    when /\Anursery(\/|\z)/
      nursery
    when /\Amarketplace(\/|\z)/
      marketplace
    when /\Aplants(\/|\z)/
      plants
    when /\Aknowledge(\/|\z)/
      knowledge
    when /\Astrategy(\/|\z)/
      strategy
    when /\Aguilds(\/|\z)/
      guilds
    when /\Aprofile(\/|\z)/
      profile
    else
      index
    end
  end

  private

  def verify_client_portal_token!
    token = params[:token]
    unless token.present?
      render plain: "Lien invalide ou manquant.", status: :unauthorized
      return
    end

    project = Design::Project.find_by(id: params[:project_id], client_portal_token: token)
    unless project
      render plain: "Lien invalide.", status: :unauthorized
    end
  end

  def require_effective_for_strategy
    return if current_member&.can_access_strategy?
    redirect_to root_path, alert: "Accès réservé aux membres effectifs"
  end

  def serialize_public_species_full(s)
    {
      id: s.id.to_s,
      slug: s.slug,
      latinName: s.latin_name,
      commonNamesFr: s.common_names_fr.presence,
      plantType: s.plant_type,
      strate: s.strate,
      successionalRole: s.successional_role,
      lifeCycle: s.life_cycle,
      growthHabit: s.growth_habit,
      growthRate: s.growth_rate,
      foliageType: s.foliage_type,
      foliageColor: s.foliage_color,
      fragrance: s.fragrance,
      fertility: s.fertility,
      pollinationType: s.pollination_type,
      rootSystem: s.root_system,
      forestGardenZone: s.forest_garden_zone,
      hardiness: s.hardiness,
      wateringNeed: s.watering_need,
      soilMoisture: s.soil_moisture,
      soilRichness: s.soil_richness,
      isInvasive: s.is_invasive,
      isDrageonnant: s.is_drageonnant,
      allelopathy: s.allelopathy.presence,
      heightMinCm: s.height_min_cm,
      heightMaxCm: s.height_max_cm,
      heightDescription: s.height_description.presence,
      spreadMinCm: s.spread_min_cm,
      spreadMaxCm: s.spread_max_cm,
      spreadDescription: s.spread_description.presence,
      plantingSpacingCm: s.planting_spacing_cm,
      lifespanMinYears: s.lifespan_min_years,
      lifespanMaxYears: s.lifespan_max_years,
      pollinationDistanceM: s.pollination_distance_m,
      flowerColors: s.flower_colors,
      floweringMonths: s.flowering_months,
      fruitingMonths: s.fruiting_months,
      harvestMonths: s.harvest_months,
      pruningMonths: s.pruning_months,
      plantingSeasons: s.planting_seasons,
      propagationMethods: s.propagation_methods,
      transformations: s.transformations,
      fodderQualities: s.fodder_qualities,
      edibleParts: s.edible_parts,
      interests: s.interests,
      ecosystemNeeds: s.ecosystem_needs,
      nativeCountries: s.native_countries,
      soilTypes: s.soil_types,
      exposures: s.exposures,
      soilPh: s.soil_ph,
      soilTexture: s.soil_texture,
      specificPollinators: s.specific_pollinators,
      toxicity: s.toxicity,
      ecoServicesProvided: s.eco_services_provided,
      ecoServicesNeeded: s.eco_services_needed,
      resourceParts: s.resource_parts,
      therapeuticProperties: s.therapeutic_properties.presence,
      additionalNotes: s.additional_notes.presence,
      edibleRating: s.edible_rating,
      medicinalRating: s.medicinal_rating
    }
  end

  def photos_for_species(species)
    Plant::Photo
      .where(target_type: 'species', target_id: species.id)
      .order(:created_at)
      .map { |p| { id: p.id.to_s, url: p.url, role: p.role, caption: p.caption.presence } }
  end

  def common_names_for_species(species)
    Plant::CommonName
      .where(target_type: 'species', target_id: species.id)
      .map { |cn| { name: cn.name, language: cn.language } }
  end
end
