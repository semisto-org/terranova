// =============================================================================
// Filter Options
// =============================================================================

export interface FilterOption {
  id: string
  label: string
}

export interface FilterOptions {
  types: FilterOption[]
  exposures: FilterOption[]
  hardinessZones: FilterOption[]
  edibleParts: FilterOption[]
  interests: FilterOption[]
  ecosystemNeeds: FilterOption[]
  propagationMethods: FilterOption[]
  flowerColors: FilterOption[]
  plantingSeasons: FilterOption[]
  months: FilterOption[]
  foliageTypes: FilterOption[]
  europeanCountries: FilterOption[]
  fertilityTypes: FilterOption[]
  rootSystems: FilterOption[]
  growthRates: FilterOption[]
  forestGardenZones: FilterOption[]
  pollinationTypes: FilterOption[]
  soilTypes: FilterOption[]
  soilMoistures: FilterOption[]
  soilRichness: FilterOption[]
  wateringNeeds: FilterOption[]
  lifeCycles: FilterOption[]
  foliageColors: FilterOption[]
  fragranceLevels: FilterOption[]
  transformations: FilterOption[]
  fodderQualities: FilterOption[]
  strates: FilterOption[]
}

// =============================================================================
// Core Botanical Types
// =============================================================================

export interface Genus {
  id: string
  latinName: string
  description: string
}

export interface Species {
  id: string
  genusId: string | null
  latinName: string
  type: 'tree' | 'shrub' | 'small-shrub' | 'climber' | 'herbaceous' | 'ground-cover'
  edibleParts: string[]
  interests: string[]
  ecosystemNeeds: string[]
  propagationMethods: string[]
  origin: string
  flowerColors: string[]
  plantingSeasons: string[]
  harvestMonths: string[]
  exposures: string[]
  hardiness: string
  fruitingMonths: string[]
  floweringMonths: string[]
  foliageType: 'deciduous' | 'semi-evergreen' | 'evergreen' | 'marcescent'
  nativeCountries: string[]
  fertility: 'self-fertile' | 'self-sterile' | 'partially-self-fertile'
  rootSystem: 'taproot' | 'fibrous' | 'spreading' | 'shallow' | 'deep'
  growthRate: 'slow' | 'medium' | 'fast' | 'slow-start' | 'fast-start'
  forestGardenZone: 'edge' | 'light-shade' | 'full-sun' | 'understory' | 'canopy'
  pollinationType: 'insect' | 'wind' | 'self' | 'bird'
  soilTypes: string[]
  soilMoisture: 'dry' | 'moist' | 'wet' | 'waterlogged'
  soilRichness: 'poor' | 'moderate' | 'rich' | 'very-rich'
  wateringNeed: '1' | '2' | '3' | '4' | '5'
  toxicElements: string | null
  isInvasive: boolean
  therapeuticProperties: string | null
  lifeCycle: 'annual' | 'biennial' | 'perennial'
  foliageColor: string
  fragrance: 'none' | 'light' | 'medium' | 'strong'
  transformations: string[]
  fodderQualities: string[]
}

export interface Variety {
  id: string
  speciesId: string
  latinName: string
  productivity: string
  fruitSize: string
  tasteRating: 1 | 2 | 3 | 4 | 5
  storageLife: string
  maturity: string
  diseaseResistance: string
}

// =============================================================================
// Associated Data Types
// =============================================================================

export type TargetType = 'genus' | 'species' | 'variety'

export interface CommonName {
  id: string
  targetId: string
  targetType: TargetType
  language: string
  name: string
}

export interface Reference {
  id: string
  targetId: string
  targetType: TargetType
  type: 'link' | 'pdf'
  title: string
  url: string
  source: string
}

export interface Photo {
  id: string
  targetId: string
  targetType: TargetType
  url: string
  caption: string
  contributorId: string
  createdAt: string
}

export interface Note {
  id: string
  targetId: string
  targetType: TargetType
  contributorId: string
  content: string
  language: string
  photos: string[]
  createdAt: string
}

export interface PlantLocation {
  id: string
  targetId: string
  targetType: 'species' | 'variety'
  latitude: number
  longitude: number
  placeName: string
  labId: string | null
  isMotherPlant: boolean
  plantedYear: number
  isPublic: boolean
}

export interface NurseryStock {
  id: string
  targetId: string
  targetType: 'species' | 'variety'
  nurseryId: string
  nurseryName: string
  quantity: number
  rootstock: string | null
  age: string
  price: number
}

// =============================================================================
// Contributor & Activity Types
// =============================================================================

export interface ContributorStats {
  speciesCreated: number
  varietiesCreated: number
  photosAdded: number
  notesWritten: number
}

export interface Contributor {
  id: string
  name: string
  avatarUrl: string
  joinedAt: string
  labId: string | null
  stats: ContributorStats
  semosEarned: number
  activityByMonth: number[]
}

export type ActivityType =
  | 'species_created'
  | 'species_updated'
  | 'variety_created'
  | 'variety_updated'
  | 'photo_added'
  | 'note_added'
  | 'reference_added'

export interface ActivityItem {
  id: string
  type: ActivityType
  contributorId: string
  targetId: string
  targetType: TargetType
  targetName: string
  timestamp: string
}

// =============================================================================
// Plant Palette Types
// =============================================================================

export interface PaletteItem {
  id: string
  type: 'species' | 'variety'
  latinName: string
}

export interface PaletteStrates {
  aquatic: PaletteItem[]
  groundCover: PaletteItem[]
  herbaceous: PaletteItem[]
  climbers: PaletteItem[]
  shrubs: PaletteItem[]
  trees: PaletteItem[]
}

export type StrateKey = keyof PaletteStrates

export interface PlantPalette {
  id: string
  name: string
  description: string
  createdBy: string
  createdAt: string
  strates: PaletteStrates
}

// =============================================================================
// AI Summary Types
// =============================================================================

export type AISummaryStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AISummary {
  status: AISummaryStatus
  content: string | null
  generatedAt: string | null
  error: string | null
}

// =============================================================================
// Search & Filter Types
// =============================================================================

export interface SearchFilters {
  query: string
  types: string[]
  exposures: string[]
  hardinessZones: string[]
  edibleParts: string[]
  interests: string[]
  nativeCountries: string[]
  soilTypes: string[]
  soilMoisture: string[]
  wateringNeed: string[]
}

export interface SearchResult {
  id: string
  type: 'genus' | 'species' | 'variety'
  latinName: string
  commonName: string | null
}

// =============================================================================
// Component Props
// =============================================================================

export interface PlantDatabaseProps {
  /** Filter options for dropdowns and checkboxes */
  filterOptions: FilterOptions
  /** All genera */
  genera: Genus[]
  /** All species */
  species: Species[]
  /** All varieties */
  varieties: Variety[]
  /** Common names for all items */
  commonNames: CommonName[]
  /** References (links and PDFs) */
  references: Reference[]
  /** Photos uploaded by contributors */
  photos: Photo[]
  /** Notes written by contributors */
  notes: Note[]
  /** Geolocated plant locations */
  plantLocations: PlantLocation[]
  /** Nursery stock availability */
  nurseryStocks: NurseryStock[]
  /** Contributor profiles */
  contributors: Contributor[]
  /** Activity feed items */
  activityFeed: ActivityItem[]
  /** Saved plant palettes */
  plantPalettes: PlantPalette[]
  /** Current user's language for common names */
  userLanguage?: string
  /** Current user's contributor ID (if logged in) */
  currentContributorId?: string | null
}

// =============================================================================
// Search View Props
// =============================================================================

export interface SearchViewProps {
  /** Filter options */
  filterOptions: FilterOptions
  /** Search results to display */
  results: SearchResult[]
  /** Current active filters */
  filters: SearchFilters
  /** IDs of items already in the palette */
  paletteItemIds?: string[]
  /** Called when user changes search query */
  onSearchChange?: (query: string) => void
  /** Called when user changes filters */
  onFiltersChange?: (filters: SearchFilters) => void
  /** Called when user selects a result */
  onResultSelect?: (id: string, type: 'genus' | 'species' | 'variety') => void
  /** Called when user adds item to palette */
  onAddToPalette?: (id: string, type: 'species' | 'variety', strate: StrateKey) => void
}

// =============================================================================
// Detail View Props
// =============================================================================

export interface GenusDetailProps {
  /** The genus to display */
  genus: Genus
  /** Species belonging to this genus */
  species: Species[]
  /** Common names for this genus */
  commonNames: CommonName[]
  /** References for this genus */
  references: Reference[]
  /** Photos of this genus */
  photos: Photo[]
  /** Notes about this genus */
  notes: Note[]
  /** Contributors who authored content */
  contributors: Contributor[]
  /** AI summary state */
  aiSummary?: AISummary
  /** Called when user requests AI summary */
  onGenerateAISummary?: () => void
  /** Called when user wants to add a photo */
  onAddPhoto?: () => void
  /** Called when user wants to add a note */
  onAddNote?: (content: string) => void
  /** Called when user wants to add a reference */
  onAddReference?: (reference: Omit<Reference, 'id' | 'targetId' | 'targetType'>) => void
  /** Called when user clicks on a species */
  onSpeciesSelect?: (speciesId: string) => void
  /** Called when user clicks on a contributor */
  onContributorSelect?: (contributorId: string) => void
}

export interface SpeciesDetailProps {
  /** The species to display */
  species: Species
  /** Parent genus */
  genus: Genus | null
  /** Varieties of this species */
  varieties: Variety[]
  /** Common names for this species */
  commonNames: CommonName[]
  /** References for this species */
  references: Reference[]
  /** Photos of this species */
  photos: Photo[]
  /** Notes about this species */
  notes: Note[]
  /** Plant locations */
  plantLocations: PlantLocation[]
  /** Nursery availability */
  nurseryStocks: NurseryStock[]
  /** Contributors who authored content */
  contributors: Contributor[]
  /** AI summary state */
  aiSummary?: AISummary
  /** Called when user requests AI summary */
  onGenerateAISummary?: () => void
  /** Called when user wants to add a photo */
  onAddPhoto?: () => void
  /** Called when user wants to add a note */
  onAddNote?: (content: string) => void
  /** Called when user wants to add a reference */
  onAddReference?: (reference: Omit<Reference, 'id' | 'targetId' | 'targetType'>) => void
  /** Called when user adds to palette */
  onAddToPalette?: (strate: StrateKey) => void
  /** Called when user clicks on a variety */
  onVarietySelect?: (varietyId: string) => void
  /** Called when user clicks on genus */
  onGenusSelect?: (genusId: string) => void
  /** Called when user clicks on a contributor */
  onContributorSelect?: (contributorId: string) => void
  /** Called when user clicks on a nursery */
  onNurserySelect?: (nurseryId: string) => void
}

export interface VarietyDetailProps {
  /** The variety to display */
  variety: Variety
  /** Parent species */
  species: Species
  /** Parent genus */
  genus: Genus | null
  /** Common names for this variety */
  commonNames: CommonName[]
  /** References for this variety */
  references: Reference[]
  /** Photos of this variety */
  photos: Photo[]
  /** Notes about this variety */
  notes: Note[]
  /** Plant locations */
  plantLocations: PlantLocation[]
  /** Nursery availability */
  nurseryStocks: NurseryStock[]
  /** Contributors who authored content */
  contributors: Contributor[]
  /** AI summary state */
  aiSummary?: AISummary
  /** Called when user requests AI summary */
  onGenerateAISummary?: () => void
  /** Called when user wants to add a photo */
  onAddPhoto?: () => void
  /** Called when user wants to add a note */
  onAddNote?: (content: string) => void
  /** Called when user wants to add a reference */
  onAddReference?: (reference: Omit<Reference, 'id' | 'targetId' | 'targetType'>) => void
  /** Called when user adds to palette */
  onAddToPalette?: (strate: StrateKey) => void
  /** Called when user clicks on species */
  onSpeciesSelect?: (speciesId: string) => void
  /** Called when user clicks on a contributor */
  onContributorSelect?: (contributorId: string) => void
  /** Called when user clicks on a nursery */
  onNurserySelect?: (nurseryId: string) => void
}

// =============================================================================
// Palette Props
// =============================================================================

export interface PlantPaletteProps {
  /** Current palette being edited */
  palette: PlantPalette | null
  /** Species data for display */
  species: Species[]
  /** Varieties data for display */
  varieties: Variety[]
  /** Called when user removes an item from palette */
  onRemoveItem?: (id: string, strate: StrateKey) => void
  /** Called when user moves item to different strate */
  onMoveItem?: (id: string, fromStrate: StrateKey, toStrate: StrateKey) => void
  /** Called when user saves the palette */
  onSave?: (name: string, description: string) => void
  /** Called when user exports to PDF */
  onExportPDF?: () => void
  /** Called when user sends to Design Studio */
  onSendToDesignStudio?: () => void
  /** Called when user clears the palette */
  onClear?: () => void
}

export interface PaletteComparisonProps {
  /** Items to compare */
  items: Array<{ item: Species | Variety; type: 'species' | 'variety' }>
  /** Properties to show in comparison */
  propertiesToCompare: string[]
  /** Called when user removes an item from comparison */
  onRemoveItem?: (id: string) => void
}

// =============================================================================
// Activity Feed Props
// =============================================================================

export interface ActivityFeedProps {
  /** Activity items to display */
  activities: ActivityItem[]
  /** Contributors for avatar/name display */
  contributors: Contributor[]
  /** Called when user clicks on an activity target */
  onActivitySelect?: (targetId: string, targetType: TargetType) => void
  /** Called when user clicks on a contributor */
  onContributorSelect?: (contributorId: string) => void
  /** Called when user wants to load more activities */
  onLoadMore?: () => void
  /** Whether more activities are available */
  hasMore?: boolean
}

// =============================================================================
// Contributor Profile Props
// =============================================================================

export interface ContributorProfileProps {
  /** The contributor to display */
  contributor: Contributor
  /** Recent activities by this contributor */
  recentActivities: ActivityItem[]
  /** Called when user clicks on an activity target */
  onActivitySelect?: (targetId: string, targetType: TargetType) => void
}

// =============================================================================
// Map Props
// =============================================================================

export interface PlantLocationMapProps {
  /** Locations to display on map */
  locations: PlantLocation[]
  /** Center coordinates */
  center?: { lat: number; lng: number }
  /** Zoom level */
  zoom?: number
  /** Called when user clicks on a location */
  onLocationSelect?: (locationId: string) => void
}
