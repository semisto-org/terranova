// =============================================================================
// Data Types
// =============================================================================

export interface Coordinates {
  lat: number
  lng: number
}

export interface GeoPoint {
  type: 'Point'
  coordinates: [number, number]
}

export interface GeoLineString {
  type: 'LineString'
  coordinates: [number, number][]
}

export interface GeoPolygon {
  type: 'Polygon'
  coordinates: [number, number][][]
}

export type GeoGeometry = GeoPoint | GeoLineString | GeoPolygon

// -----------------------------------------------------------------------------
// Core Entities
// -----------------------------------------------------------------------------

export type VillageBadge = 'eveil' | 'planteur' | 'nourricier' | 'resilient'

export interface Village {
  id: string
  name: string
  region: string
  country: string
  coordinates: Coordinates
  badge: VillageBadge
  badgeProgress: number
  hectaresPotential: number
  hectaresPlanted: number
  spotsIdentified: number
  spotsPlanted: number
  activeCitizens: number
  ambassadorName: string | null
  joinedAt: string
}

export type SpotType = 'haie' | 'surface' | 'arbre_isole'
export type SpotStatus = 'identifie' | 'valide' | 'assigne' | 'plante'
export type SoilType = 'limoneux' | 'argileux' | 'sableux' | 'inconnu'
export type Exposure = 'nord' | 'sud' | 'est' | 'ouest' | 'sud-ouest' | 'plein_soleil' | 'inconnu'
export type LandOwnership = 'public' | 'prive' | 'inconnu'
export type MaturityLevel = 'fragile' | 'etablie' | 'autonome'

export interface Spot {
  id: string
  villageId: string
  type: SpotType
  status: SpotStatus
  geometry: GeoGeometry
  lengthMeters: number | null
  areaSquareMeters: number | null
  photos: string[]
  soilType: SoilType
  exposure: Exposure
  landOwnership: LandOwnership
  constraints: string[]
  opportunityScore: number
  validationCount: number
  reportedById: string
  reportedAt: string
  validatedAt: string | null
  plantedAt: string | null
  sponsorId: string | null
  maturityLevel: MaturityLevel | null
  speciesPlanted: string[]
}

export type CitizenRole = 'membre' | 'parrain' | 'ambassadeur' | 'admin'
export type BadgeName = 'explorateur' | 'cartographe' | 'planteur' | 'parrain' | 'mentor' | 'transmetteur'

export interface Citizen {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string
  role: CitizenRole
  villageIds: string[]
  badges: BadgeName[]
  spotsReported: number
  spotsValidated: number
  worksitesAttended: number
  totalDonations: number
  hoursContributed: number
  joinedAt: string
  bio: string
}

// -----------------------------------------------------------------------------
// Campaigns & Wishlist
// -----------------------------------------------------------------------------

export type CampaignCategory = 'poste' | 'projet' | 'evenement' | 'materiel'
export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type UrgencyLevel = 'low' | 'medium' | 'high'

export interface Campaign {
  id: string
  title: string
  description: string
  category: CampaignCategory
  imageUrl: string
  goalAmount: number
  currentAmount: number
  contributorsCount: number
  deadline: string
  createdAt: string
  status: CampaignStatus
  urgencyLevel: UrgencyLevel
}

export type WishlistCategory = 'livre' | 'outil' | 'materiel' | 'logistique' | 'communication'
export type WishlistStatus = 'available' | 'partial' | 'funded'

export interface WishlistItem {
  id: string
  title: string
  description: string
  category: WishlistCategory
  imageUrl: string
  price: number
  quantity: number
  quantityFunded: number
  status: WishlistStatus
}

// -----------------------------------------------------------------------------
// Worksites & Events
// -----------------------------------------------------------------------------

export type WorksiteStatus = 'upcoming' | 'full' | 'in_progress' | 'completed' | 'cancelled'

export interface Worksite {
  id: string
  title: string
  description: string
  villageId: string
  spotId: string | null
  date: string
  startTime: string
  endTime: string
  location: string
  coordinates: Coordinates
  maxParticipants: number
  currentParticipants: number
  participantIds: string[]
  organizerId: string
  status: WorksiteStatus
  imageUrl: string
  requirements: string[]
  provided: string[]
}

export type EventType = 'portes_ouvertes' | 'formation' | 'fete_recolte' | 'atelier' | 'reunion'

export interface Event {
  id: string
  title: string
  description: string
  type: EventType
  villageId: string | null
  date: string
  startTime: string
  endTime: string
  location: string
  coordinates: Coordinates
  imageUrl: string
  organizerId: string
  registrationRequired: boolean
  maxAttendees: number | null
  currentAttendees: number
}

// -----------------------------------------------------------------------------
// Marketplace & Skills
// -----------------------------------------------------------------------------

export type SurplusCategory = 'fruits' | 'greffons' | 'boutures' | 'semences' | 'transforme'
export type ExchangeMode = 'don' | 'troc' | 'vente'
export type SurplusStatus = 'available' | 'reserved' | 'exchanged'

export interface Surplus {
  id: string
  citizenId: string
  title: string
  description: string
  category: SurplusCategory
  quantity: string
  exchangeMode: ExchangeMode
  price: number | null
  imageUrl: string
  villageId: string
  availableFrom: string
  availableUntil: string
  status: SurplusStatus
}

export type SkillCategory = 'greffe' | 'taille' | 'sol' | 'design' | 'identification' | 'multiplication'
export type ExperienceLevel = 'debutant' | 'confirme' | 'expert'
export type Availability = 'weekends' | 'semaine' | 'hiver' | 'flexible'
export type ContactPreference = 'email' | 'telephone' | 'messagerie'

export interface Skill {
  id: string
  citizenId: string
  title: string
  description: string
  category: SkillCategory
  experienceLevel: ExperienceLevel
  villageIds: string[]
  availability: Availability
  contactPreference: ContactPreference
  imageUrl: string
}

// -----------------------------------------------------------------------------
// Site Log & Badges
// -----------------------------------------------------------------------------

export type LogEntryType = 'plantation' | 'observation' | 'tache' | 'recolte' | 'probleme'
export type HealthStatus = 'excellent' | 'bon' | 'moyen' | 'mauvais'

export interface SiteLogEntry {
  id: string
  spotId: string
  citizenId: string
  date: string
  type: LogEntryType
  title: string
  description: string
  photoUrls: string[]
  healthStatus: HealthStatus | null
  tasksCompleted: string[]
}

export type BadgeType = 'individual' | 'village'

export interface Badge {
  id: string
  type: BadgeType
  name: string
  description: string
  iconName: string
  color: string
  criteria: string
}

// -----------------------------------------------------------------------------
// Challenges & Contributions
// -----------------------------------------------------------------------------

export type ChallengeType = 'plantation' | 'cartographie' | 'formation'
export type ChallengeStatus = 'upcoming' | 'active' | 'completed'

export interface ChallengeRanking {
  villageId: string
  villageName: string
  score: number
}

export interface SeasonalChallenge {
  id: string
  title: string
  description: string
  type: ChallengeType
  metric: string
  startDate: string
  endDate: string
  status: ChallengeStatus
  rankings: ChallengeRanking[]
  prizes: string[]
}

export type ContributionType = 'don' | 'benevolat' | 'materiel'
export type ContributionTargetType = 'campaign' | 'wishlist' | 'worksite' | 'general'

export interface Contribution {
  id: string
  citizenId: string | null
  type: ContributionType
  amount?: number
  hours?: number
  targetType: ContributionTargetType
  targetId: string | null
  date: string
  message: string | null
  isAnonymous: boolean
}

// -----------------------------------------------------------------------------
// Activity & Stats
// -----------------------------------------------------------------------------

export type ActivityType = 'spot_reported' | 'spot_validated' | 'spot_planted' | 'contribution' | 'badge_earned' | 'village_badge' | 'worksite_created' | 'citizen_joined'

export interface RecentActivity {
  id: string
  type: ActivityType
  citizenId: string | null
  citizenName: string | null
  villageId: string | null
  villageName: string | null
  description: string
  timestamp: string
}

export interface ImpactStats {
  treesPlanted: number
  hectaresMapped: number
  hectaresPlanted: number
  activeVillages: number
  activeCitizens: number
  co2Captured: number
  futureHarvest: number
}

// =============================================================================
// Component Props
// =============================================================================

export interface CitizenEngagementHubProps {
  /** Global impact statistics for the hero section */
  impactStats: ImpactStats
  /** Recent activity feed */
  recentActivity: RecentActivity[]
  /** Active campaigns to highlight */
  campaigns: Campaign[]
  /** Upcoming worksites */
  worksites: Worksite[]
  /** Upcoming events */
  events: Event[]
  /** Current user profile (null if visitor) */
  currentCitizen: Citizen | null
  /** Called when user wants to view the map */
  onNavigateToMap?: () => void
  /** Called when user wants to contribute */
  onNavigateToContribute?: () => void
  /** Called when user wants to view a campaign */
  onViewCampaign?: (id: string) => void
  /** Called when user wants to join a worksite */
  onJoinWorksite?: (id: string) => void
  /** Called when user wants to view an event */
  onViewEvent?: (id: string) => void
}

export interface MapViewProps {
  /** All villages to display on the map */
  villages: Village[]
  /** All spots to display on the map */
  spots: Spot[]
  /** Currently selected village (for filtering) */
  selectedVillageId: string | null
  /** Current user for permission checks */
  currentCitizen: Citizen | null
  /** Called when a village is selected */
  onSelectVillage?: (id: string) => void
  /** Called when a spot is selected */
  onSelectSpot?: (id: string) => void
  /** Called when user wants to report a new spot */
  onReportSpot?: (geometry: GeoGeometry) => void
  /** Called when user validates a spot */
  onValidateSpot?: (id: string) => void
  /** Called when user reports an issue with a spot */
  onReportIssue?: (id: string, issue: string) => void
}

export interface ContributeViewProps {
  /** Active campaigns */
  campaigns: Campaign[]
  /** Wishlist items */
  wishlistItems: WishlistItem[]
  /** Upcoming worksites to join */
  worksites: Worksite[]
  /** Current user profile */
  currentCitizen: Citizen | null
  /** Called when user donates to a campaign */
  onDonateToCampaign?: (campaignId: string, amount: number) => void
  /** Called when user funds a wishlist item */
  onFundWishlistItem?: (itemId: string, quantity: number) => void
  /** Called when user joins a worksite */
  onJoinWorksite?: (worksiteId: string) => void
  /** Called when user leaves a worksite */
  onLeaveWorksite?: (worksiteId: string) => void
}

export interface VillageDetailProps {
  /** The village to display */
  village: Village
  /** Spots in this village */
  spots: Spot[]
  /** Citizens active in this village */
  citizens: Citizen[]
  /** Upcoming worksites in this village */
  worksites: Worksite[]
  /** Events in this village */
  events: Event[]
  /** Current user profile */
  currentCitizen: Citizen | null
  /** Called when user wants to join this village */
  onJoinVillage?: () => void
  /** Called when user views a spot */
  onViewSpot?: (id: string) => void
  /** Called when user views a citizen profile */
  onViewCitizen?: (id: string) => void
}

export interface SpotDetailProps {
  /** The spot to display */
  spot: Spot
  /** Village this spot belongs to */
  village: Village
  /** Sponsor citizen (if any) */
  sponsor: Citizen | null
  /** Log entries for this spot */
  logEntries: SiteLogEntry[]
  /** Current user profile */
  currentCitizen: Citizen | null
  /** Called when user validates this spot */
  onValidate?: () => void
  /** Called when user wants to sponsor this spot */
  onSponsor?: () => void
  /** Called when user adds a log entry */
  onAddLogEntry?: (entry: Omit<SiteLogEntry, 'id' | 'spotId' | 'citizenId'>) => void
  /** Called when user reports an issue */
  onReportIssue?: (issue: string) => void
}

export interface CitizenProfileProps {
  /** The citizen profile to display */
  citizen: Citizen
  /** Villages the citizen belongs to */
  villages: Village[]
  /** Available badges (to show progress) */
  allBadges: Badge[]
  /** Citizen's contributions */
  contributions: Contribution[]
  /** Citizen's surplus listings */
  surpluses: Surplus[]
  /** Citizen's skills */
  skills: Skill[]
  /** Whether this is the current user's own profile */
  isOwnProfile: boolean
  /** Called when user edits their profile */
  onEditProfile?: () => void
  /** Called when user adds a surplus */
  onAddSurplus?: () => void
  /** Called when user adds a skill */
  onAddSkill?: () => void
  /** Called when user wants to contact this citizen */
  onContact?: () => void
}

export interface MarketplaceViewProps {
  /** Available surpluses */
  surpluses: Surplus[]
  /** Citizens who posted surpluses */
  citizens: Citizen[]
  /** Current user's village IDs for filtering nearby */
  currentVillageIds: string[]
  /** Called when user wants to contact a seller */
  onContactSeller?: (surplusId: string) => void
  /** Called when user reserves a surplus */
  onReserveSurplus?: (surplusId: string) => void
  /** Called when user adds their own surplus */
  onAddSurplus?: () => void
}

export interface SkillsDirectoryProps {
  /** Available skills */
  skills: Skill[]
  /** Citizens who offer skills */
  citizens: Citizen[]
  /** Current user's village IDs for filtering nearby */
  currentVillageIds: string[]
  /** Called when user wants to contact a gardener */
  onContactGardener?: (skillId: string) => void
  /** Called when user adds their own skill */
  onAddSkill?: () => void
}

export interface LeaderboardViewProps {
  /** All villages with their rankings */
  villages: Village[]
  /** All badges (village and individual) */
  badges: Badge[]
  /** Seasonal challenges */
  challenges: SeasonalChallenge[]
  /** Top contributors */
  topCitizens: Citizen[]
  /** Called when user views a village */
  onViewVillage?: (id: string) => void
  /** Called when user views a challenge */
  onViewChallenge?: (id: string) => void
}
