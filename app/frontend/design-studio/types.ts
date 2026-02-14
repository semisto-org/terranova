// =============================================================================
// Core Types
// =============================================================================

export type ProjectPhase = 'offre' | 'pre-projet' | 'projet-detaille' | 'mise-en-oeuvre' | 'co-gestion'
export type ProjectStatus = 'active' | 'pending' | 'completed' | 'archived'
export type TeamRole = 'project-manager' | 'designer' | 'butineur'
export type TimesheetMode = 'billed' | 'semos'
export type ExpenseCategory = 'plants' | 'material' | 'travel' | 'services' | 'other'
export type ExpenseStatus = 'pending' | 'approved' | 'rejected'
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
export type PlantLayer = 'canopy' | 'sub-canopy' | 'shrub' | 'herbaceous' | 'ground-cover' | 'vine' | 'root'
export type PlantStatus = 'alive' | 'dead' | 'to-replace' | 'replaced'
export type MediaType = 'image' | 'video'
export type AnnotationAuthorType = 'team' | 'client'
export type VisitType = 'follow-up' | 'intervention' | 'client-meeting'
export type InterventionType = 'planting' | 'mulching' | 'pruning' | 'watering' | 'treatment' | 'replacement' | 'other'
export type UsageMapType = 'passage' | 'preserve-view' | 'favorite' | 'avoid' | 'wet-zone' | 'sunny-zone'
export type HarvestProduct = 'fruits' | 'feuilles' | 'fleurs' | 'racines' | 'écorce' | 'sève'

// =============================================================================
// Coordinates
// =============================================================================

export interface Coordinates {
  lat: number
  lng: number
}

// =============================================================================
// Project
// =============================================================================

export interface ProjectBudget {
  hoursPlanned: number
  hoursWorked: number
  hoursBilled: number
  hoursSemos: number
  expensesBudget: number
  expensesActual: number
}

export interface Project {
  id: string
  name: string
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  placeId: string
  address: string
  coordinates: Coordinates
  area: number
  phase: ProjectPhase
  status: ProjectStatus
  startDate: string | null
  plantingDate: string | null
  projectManagerId: string
  budget: ProjectBudget
  templateId: string | null
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Team
// =============================================================================

export interface TeamMember {
  id: string
  projectId: string
  memberId: string
  memberName: string
  memberEmail: string
  memberAvatar: string
  role: TeamRole
  isPaid: boolean
  assignedAt: string
}

// =============================================================================
// Timesheets & Expenses
// =============================================================================

export interface Timesheet {
  id: string
  projectId: string
  memberId: string
  memberName: string
  date: string
  hours: number
  phase: ProjectPhase
  mode: TimesheetMode
  travelKm: number
  notes: string
}

export interface Expense {
  id: string
  projectId: string
  date: string
  amount: number
  category: ExpenseCategory
  description: string
  phase: ProjectPhase
  memberId: string
  memberName: string
  receiptUrl: string
  status: ExpenseStatus
}

// =============================================================================
// Site Analysis
// =============================================================================

export interface ClimateAnalysis {
  hardinessZone: string
  frostFreeDays: number
  annualRainfall: number
  notes: string
}

export interface GeomorphologyAnalysis {
  slope: string
  aspect: string
  elevation: number
  soilType: string
  notes: string
}

export interface WaterAnalysis {
  sources: string[]
  wetZones: string
  drainage: string
  notes: string
}

export interface SocioEconomicAnalysis {
  ownership: string
  easements: string
  neighbors: string
  localMarket: string
  notes: string
}

export interface AccessAnalysis {
  mainAccess: string
  secondaryAccess: string
  parking: string
  notes: string
}

export interface VegetationAnalysis {
  existingTrees: string[]
  problematicSpecies: string[]
  notableFeatures: string
  notes: string
}

export interface MicroclimateAnalysis {
  windExposure: string
  sunPatterns: string
  frostPockets: string
  notes: string
}

export interface BuildingsAnalysis {
  existing: string[]
  utilities: string
  notes: string
}

export interface SoilAnalysis {
  type: string
  ph: number
  organic: string
  texture: string
  notes: string
}

export interface ClientObservations {
  sunnyAreas: string
  wetAreas: string
  windyAreas: string
  favoriteSpots: string
  historyNotes: string
}

export interface ClientPhoto {
  id: string
  url: string
  caption: string
  coordinates: Coordinates
  takenAt: string
}

export interface UsageMapItem {
  id: string
  type: UsageMapType
  coordinates: Coordinates[]
  description: string
}

export interface SiteAnalysis {
  id: string
  projectId: string
  updatedAt: string
  climate: ClimateAnalysis
  geomorphology: GeomorphologyAnalysis
  water: WaterAnalysis
  socioEconomic: SocioEconomicAnalysis
  access: AccessAnalysis
  vegetation: VegetationAnalysis
  microclimate: MicroclimateAnalysis
  buildings: BuildingsAnalysis
  soil: SoilAnalysis
  clientObservations: ClientObservations
  clientPhotos: ClientPhoto[]
  clientUsageMap: UsageMapItem[]
}

// =============================================================================
// Plant Palette
// =============================================================================

export interface PaletteItem {
  id: string
  speciesId: string
  speciesName: string
  commonName: string
  varietyId: string | null
  varietyName: string | null
  layer: PlantLayer
  quantity: number
  unitPrice: number
  notes: string
  harvestMonths: number[]
  harvestProducts: HarvestProduct[]
}

export interface LayerTotals {
  count: number
  cost: number
}

export interface PaletteTotals {
  totalPlants: number
  totalCost: number
  byLayer: Record<PlantLayer, LayerTotals>
}

export interface PlantPalette {
  id: string
  projectId: string
  updatedAt: string
  items: PaletteItem[]
  totals: PaletteTotals
}

// =============================================================================
// Planting Plan
// =============================================================================

export interface PlantMarker {
  id: string
  paletteItemId: string
  number: number
  x: number
  y: number
  speciesName: string
  varietyName: string | null
}

export interface PlantingPlan {
  id: string
  projectId: string
  imageUrl: string
  imageWidth: number
  imageHeight: number
  scale: number
  updatedAt: string
  markers: PlantMarker[]
}

// =============================================================================
// Quotes
// =============================================================================

export interface QuoteLine {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
}

export interface Quote {
  id: string
  projectId: string
  version: number
  status: QuoteStatus
  title: string
  createdAt: string
  validUntil: string
  approvedAt: string | null
  approvedBy: string | null
  clientComment: string | null
  lines: QuoteLine[]
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number
}

// =============================================================================
// Documents & Media
// =============================================================================

export interface ProjectDocument {
  id: string
  projectId: string
  category: string
  name: string
  url: string
  size: number
  uploadedAt: string
  uploadedBy: string
}

export interface MediaItem {
  id: string
  projectId: string
  type: MediaType
  url: string
  thumbnailUrl: string
  caption: string
  takenAt: string
  uploadedAt: string
  uploadedBy: string
}

// =============================================================================
// Meetings
// =============================================================================

export interface Meeting {
  id: string
  projectId: string
  title: string
  date: string
  time: string
  duration: number
  location: string
  attendees: string[]
  notes: string
  aiSummary: string
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Annotations
// =============================================================================

export interface Annotation {
  id: string
  projectId: string
  documentId: string
  x: number
  y: number
  authorId: string
  authorName: string
  authorType: AnnotationAuthorType
  content: string
  createdAt: string
  resolved: boolean
}

// =============================================================================
// Plant Follow-Up (Co-gestion)
// =============================================================================

export interface PlantRecord {
  id: string
  paletteItemId: string
  markerId: string | null
  speciesName: string
  varietyName: string | null
  plantedAt: string
  status: PlantStatus
  healthScore: number
  lastChecked: string
  notes: string
}

export interface FollowUpVisit {
  id: string
  date: string
  type: VisitType
  memberId: string
  memberName: string
  notes: string
  photos: string[]
}

export interface Intervention {
  id: string
  date: string
  type: InterventionType
  description: string
  memberId: string
  memberName: string
}

export interface PlantFollowUp {
  projectId: string
  plants: PlantRecord[]
  visits: FollowUpVisit[]
  interventions: Intervention[]
}

// =============================================================================
// Client Contributions
// =============================================================================

export interface TerrainQuestionnaire {
  completedAt: string
  responses: {
    sunObservations: string
    wetAreas: string
    windPatterns: string
    soilHistory: string
    existingWildlife: string
  }
}

export interface WishlistItem {
  id: string
  type: 'fruit' | 'herb' | 'flower' | 'tree' | 'other'
  description: string
  addedAt: string
}

export interface JournalEntry {
  id: string
  date: string
  text: string
  photos: string[]
}

export interface PlantJournal {
  id: string
  plantId: string
  speciesName: string
  varietyName: string | null
  entries: JournalEntry[]
}

export interface ClientContributions {
  projectId: string
  clientId: string
  terrainQuestionnaire: TerrainQuestionnaire
  wishlist: WishlistItem[]
  plantJournal: PlantJournal[]
}

// =============================================================================
// Calendars
// =============================================================================

export interface HarvestEntry {
  product: HarvestProduct
  species: string
  commonName: string
  notes: string
}

export interface HarvestMonth {
  month: number
  name: string
  harvests: HarvestEntry[]
}

export interface HarvestCalendar {
  projectId: string
  months: HarvestMonth[]
}

export interface MaintenanceTask {
  title: string
  description: string
  videoUrl: string | null
  photos: string[]
}

export interface MaintenanceMonth {
  month: number
  name: string
  tasks: MaintenanceTask[]
}

export interface MaintenanceCalendar {
  projectId: string
  months: MaintenanceMonth[]
}

// =============================================================================
// Templates
// =============================================================================

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  defaultPhases: ProjectPhase[]
  suggestedHours: number
  suggestedBudget: number
}

// =============================================================================
// Dashboard
// =============================================================================

export interface UpcomingMeeting {
  id: string
  projectId: string
  projectName: string
  title: string
  date: string
  time: string
}

export interface DashboardStats {
  activeProjects: number
  pendingProjects: number
  totalProjects: number
  totalHoursThisMonth: number
  totalRevenueThisYear: number
  quoteConversionRate: number
  upcomingMeetings: UpcomingMeeting[]
}

// =============================================================================
// Component Props
// =============================================================================

/** Props for the project dashboard/list view */
export interface ProjectDashboardProps {
  projects: Project[]
  stats: DashboardStats
  templates: ProjectTemplate[]
  onViewProject?: (id: string) => void
  onEditProject?: (id: string) => void
  onDeleteProject?: (id: string) => void
  onCreateProject?: (templateId?: string) => void
  onDuplicateProject?: (id: string) => void
}

/** Props for the project detail view */
export interface ProjectDetailProps {
  project: Project
  teamMembers: TeamMember[]
  timesheets: Timesheet[]
  expenses: Expense[]
  siteAnalysis: SiteAnalysis | null
  plantPalette: PlantPalette | null
  plantingPlan: PlantingPlan | null
  quotes: Quote[]
  documents: ProjectDocument[]
  mediaItems: MediaItem[]
  meetings: Meeting[]
  annotations: Annotation[]
  plantFollowUp: PlantFollowUp | null
  clientContributions: ClientContributions | null
  harvestCalendar: HarvestCalendar | null
  maintenanceCalendar: MaintenanceCalendar | null
  onEditProject?: (id: string) => void
  onChangePhase?: (id: string, phase: ProjectPhase) => void
  onAssignMember?: (projectId: string, memberId: string, role: TeamRole) => void
  onRemoveMember?: (projectId: string, memberId: string) => void
  onAddTimesheet?: (timesheet: Omit<Timesheet, 'id'>) => void
  onEditTimesheet?: (id: string) => void
  onDeleteTimesheet?: (id: string) => void
  onAddExpense?: (expense: Omit<Expense, 'id'>) => void
  onEditExpense?: (id: string) => void
  onDeleteExpense?: (id: string) => void
  onApproveExpense?: (id: string) => void
  onUpdateSiteAnalysis?: (analysis: Partial<SiteAnalysis>) => void
  onAddPaletteItem?: (item: Omit<PaletteItem, 'id'>) => void
  onEditPaletteItem?: (id: string) => void
  onRemovePaletteItem?: (id: string) => void
  onExportPalette?: () => void
  onUploadPlanImage?: (file: File) => void
  onPlaceMarker?: (x: number, y: number, paletteItemId: string) => void
  onMoveMarker?: (markerId: string, x: number, y: number) => void
  onRemoveMarker?: (markerId: string) => void
  onExportPlan?: (format: 'pdf' | 'image') => void
  onCreateQuote?: () => void
  onEditQuote?: (id: string) => void
  onDeleteQuote?: (id: string) => void
  onSendQuote?: (id: string) => void
  onUploadDocument?: (file: File, category: string) => void
  onDeleteDocument?: (id: string) => void
  onUploadMedia?: (file: File) => void
  onDeleteMedia?: (id: string) => void
  onCreateMeeting?: () => void
  onEditMeeting?: (id: string) => void
  onDeleteMeeting?: (id: string) => void
  onAddAnnotation?: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void
  onResolveAnnotation?: (id: string) => void
  onDeleteAnnotation?: (id: string) => void
  onUpdatePlantStatus?: (plantId: string, status: PlantStatus) => void
  onAddVisit?: (visit: Omit<FollowUpVisit, 'id'>) => void
  onAddIntervention?: (intervention: Omit<Intervention, 'id'>) => void
  onEditMaintenanceCalendar?: (month: number, tasks: MaintenanceTask[]) => void
  onSearch?: (query: string) => void
}

/** Props for the planting plan editor */
export interface PlantingPlanEditorProps {
  plan: PlantingPlan | null
  palette: PlantPalette | null
  onUploadImage?: (file: File) => void
  onPlaceMarker?: (x: number, y: number, paletteItemId: string) => void
  onMoveMarker?: (markerId: string, x: number, y: number) => void
  onRemoveMarker?: (markerId: string) => void
  onExport?: (format: 'pdf' | 'image') => void
}

/** Props for the quote builder */
export interface QuoteBuilderProps {
  quote: Quote | null
  projectName: string
  clientName: string
  onAddLine?: (line: Omit<QuoteLine, 'id' | 'total'>) => void
  onEditLine?: (id: string, line: Partial<QuoteLine>) => void
  onRemoveLine?: (id: string) => void
  onUpdateVatRate?: (rate: number) => void
  onSave?: () => void
  onSend?: () => void
  onExport?: () => void
}

/** Props for the client portal */
export interface ClientPortalProps {
  project: Project
  documents: ProjectDocument[]
  plantPalette: PlantPalette | null
  plantingPlan: PlantingPlan | null
  quotes: Quote[]
  annotations: Annotation[]
  clientContributions: ClientContributions | null
  harvestCalendar: HarvestCalendar | null
  maintenanceCalendar: MaintenanceCalendar | null
  onApproveQuote?: (quoteId: string, comment?: string) => void
  onRejectQuote?: (quoteId: string, comment: string) => void
  onAddAnnotation?: (documentId: string, x: number, y: number, content: string) => void
  onSubmitQuestionnaire?: (responses: TerrainQuestionnaire['responses']) => void
  onUploadPhoto?: (file: File, caption: string, coordinates?: Coordinates) => void
  onAddUsageMapItem?: (item: Omit<UsageMapItem, 'id'>) => void
  onAddWishlistItem?: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => void
  onAddJournalEntry?: (plantId: string, text: string, photos?: File[]) => void
}

/** Props for the site analysis form */
export interface SiteAnalysisFormProps {
  analysis: SiteAnalysis | null
  onUpdate?: (section: keyof SiteAnalysis, data: unknown) => void
  onSave?: () => void
}

/** Props for the plant palette editor */
export interface PlantPaletteEditorProps {
  palette: PlantPalette | null
  onAddItem?: (item: Omit<PaletteItem, 'id'>) => void
  onEditItem?: (id: string, item: Partial<PaletteItem>) => void
  onRemoveItem?: (id: string) => void
  onSearchPlants?: (query: string) => void
  onExport?: () => void
}

/** Props for the co-gestion view */
export interface CoGestionProps {
  followUp: PlantFollowUp | null
  clientContributions: ClientContributions | null
  onUpdatePlantStatus?: (plantId: string, status: PlantStatus, notes?: string) => void
  onAddVisit?: (visit: Omit<FollowUpVisit, 'id'>) => void
  onAddIntervention?: (intervention: Omit<Intervention, 'id'>) => void
}

/** Props for the harvest calendar view */
export interface HarvestCalendarProps {
  calendar: HarvestCalendar | null
  onAdjustHarvest?: (month: number, species: string, adjustment: Partial<HarvestEntry>) => void
}

/** Props for the maintenance calendar view */
export interface MaintenanceCalendarProps {
  calendar: MaintenanceCalendar | null
  onAddTask?: (month: number, task: MaintenanceTask) => void
  onEditTask?: (month: number, index: number, task: Partial<MaintenanceTask>) => void
  onRemoveTask?: (month: number, index: number) => void
}
