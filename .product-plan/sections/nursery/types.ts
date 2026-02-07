// =============================================================================
// Data Types
// =============================================================================

/** Type de pépinière dans le réseau */
export type NurseryType = 'semisto' | 'partner'

/** Mode d'intégration de la pépinière */
export type NurseryIntegration = 'platform' | 'manual'

/** Pépinière du réseau Semisto */
export interface Nursery {
  id: string
  name: string
  type: NurseryType
  integration: NurseryIntegration
  address: string
  city: string
  postalCode: string
  country: string
  coordinates: { lat: number; lng: number }
  contactName: string
  contactEmail: string
  contactPhone?: string
  website?: string
  description?: string
  specialties?: string[]
  isPickupPoint: boolean
  createdAt: string
}

/** Type de contenant pour les plants */
export interface Container {
  id: string
  name: string
  shortName: string
  volumeLiters?: number
  description?: string
  sortOrder: number
}

/** Stade de développement d'un lot */
export type GrowthStage = 'seed' | 'seedling' | 'young' | 'established' | 'mature'

/** Lot de stock */
export interface StockBatch {
  id: string
  nurseryId: string
  speciesId: string
  speciesName: string
  varietyId?: string
  varietyName?: string
  containerId: string
  quantity: number
  availableQuantity: number
  reservedQuantity: number
  sowingDate?: string
  origin?: string
  growthStage?: GrowthStage
  priceEuros: number
  acceptsSemos: boolean
  priceSemos?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

/** Source d'un plant-mère */
export type MotherPlantSource = 'design-studio' | 'member-proposal'

/** Statut de validation d'un plant-mère */
export type MotherPlantStatus = 'pending' | 'validated' | 'rejected'

/** Plant-mère disponible pour multiplication */
export interface MotherPlant {
  id: string
  speciesId: string
  speciesName: string
  varietyId?: string
  varietyName?: string
  placeId: string
  placeName: string
  placeAddress: string
  plantingDate: string
  source: MotherPlantSource
  projectId?: string
  projectName?: string
  memberId?: string
  memberName?: string
  status: MotherPlantStatus
  validatedAt?: string
  validatedBy?: string
  quantity: number
  notes?: string
  lastHarvestDate?: string
  createdAt: string
}

/** Statut d'une commande */
export type OrderStatus = 'new' | 'processing' | 'ready' | 'picked-up' | 'cancelled'

/** Niveau de prix choisi */
export type PriceLevel = 'solidarity' | 'standard' | 'support'

/** Ligne de commande */
export interface OrderLine {
  id: string
  stockBatchId: string
  nurseryId: string
  nurseryName: string
  speciesName: string
  varietyName?: string
  containerName: string
  quantity: number
  unitPriceEuros: number
  unitPriceSemos?: number
  payInSemos: boolean
  totalEuros: number
  totalSemos: number
}

/** Commande de plants */
export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  isMember: boolean
  status: OrderStatus
  priceLevel: PriceLevel
  pickupNurseryId: string
  pickupNurseryName: string
  lines: OrderLine[]
  subtotalEuros: number
  subtotalSemos: number
  totalEuros: number
  totalSemos: number
  notes?: string
  createdAt: string
  preparedAt?: string
  readyAt?: string
  pickedUpAt?: string
}

/** Statut d'un transfert */
export type TransferStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled'

/** Étape d'un transfert */
export interface TransferStop {
  nurseryId: string
  nurseryName: string
  address: string
  type: 'pickup' | 'dropoff'
  items: { speciesName: string; varietyName?: string; quantity: number }[]
  estimatedTime?: string
  completedAt?: string
}

/** Transfert inter-pépinières */
export interface Transfer {
  id: string
  orderId: string
  orderNumber: string
  status: TransferStatus
  stops: TransferStop[]
  totalDistanceKm: number
  estimatedDuration: string
  driverId?: string
  driverName?: string
  vehicleInfo?: string
  scheduledDate: string
  notes?: string
  createdAt: string
  completedAt?: string
}

/** Rôle d'une personne dans la pépinière */
export type TeamRole = 'manager' | 'employee' | 'intern' | 'volunteer'

/** Membre de l'équipe pépinière */
export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamRole
  nurseryId: string
  nurseryName: string
  avatarUrl?: string
  phone?: string
  startDate: string
  endDate?: string
}

/** Créneau de planning */
export interface ScheduleSlot {
  id: string
  memberId: string
  memberName: string
  memberRole: TeamRole
  nurseryId: string
  nurseryName: string
  date: string
  startTime: string
  endTime: string
  activity?: string
  notes?: string
}

/** Type d'entrée de documentation */
export type DocumentationType = 'journal' | 'technical-sheet' | 'video-tutorial'

/** Entrée de documentation */
export interface DocumentationEntry {
  id: string
  type: DocumentationType
  title: string
  content?: string
  videoUrl?: string
  thumbnailUrl?: string
  authorId: string
  authorName: string
  nurseryId?: string
  nurseryName?: string
  tags?: string[]
  publishedAt: string
  updatedAt: string
}

/** Catégorie d'activité pour les timesheets */
export type TimesheetCategory = 
  | 'propagation'
  | 'potting'
  | 'watering'
  | 'maintenance'
  | 'harvesting'
  | 'order-preparation'
  | 'transfer'
  | 'documentation'
  | 'training'
  | 'admin'
  | 'other'

/** Entrée de timesheet */
export interface TimesheetEntry {
  id: string
  memberId: string
  memberName: string
  nurseryId: string
  nurseryName: string
  date: string
  category: TimesheetCategory
  hours: number
  description?: string
  createdAt: string
}

/** Alerte du tableau de bord */
export type AlertType = 'low-stock' | 'pending-order' | 'pending-transfer' | 'pending-validation'

export interface DashboardAlert {
  id: string
  type: AlertType
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  relatedId: string
  createdAt: string
}

// =============================================================================
// Component Props
// =============================================================================

/** Props pour le tableau de bord Nursery */
export interface NurseryDashboardProps {
  alerts: DashboardAlert[]
  lowStockCount: number
  pendingOrdersCount: number
  pendingTransfersCount: number
  pendingValidationsCount: number
  todaySchedule: ScheduleSlot[]
  recentOrders: Order[]
  onViewStock?: () => void
  onViewOrders?: () => void
  onViewTransfers?: () => void
  onViewValidations?: () => void
  onViewSchedule?: () => void
  onAlertClick?: (alertId: string, type: AlertType) => void
}

/** Props pour la liste des pépinières */
export interface NurseryListProps {
  nurseries: Nursery[]
  onView?: (id: string) => void
  onCreate?: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

/** Props pour la gestion du stock */
export interface StockManagementProps {
  batches: StockBatch[]
  nurseries: Nursery[]
  containers: Container[]
  onView?: (id: string) => void
  onCreate?: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onFilter?: (filters: { nurseryId?: string; speciesId?: string; containerId?: string; stage?: GrowthStage }) => void
}

/** Props pour la liste des contenants */
export interface ContainerListProps {
  containers: Container[]
  onCreate?: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onReorder?: (containers: Container[]) => void
}

/** Props pour la liste des plants-mères */
export interface MotherPlantListProps {
  motherPlants: MotherPlant[]
  onView?: (id: string) => void
  onValidate?: (id: string) => void
  onReject?: (id: string) => void
  onFilter?: (filters: { speciesId?: string; status?: MotherPlantStatus; source?: MotherPlantSource }) => void
}

/** Props pour la liste des commandes */
export interface OrderListProps {
  orders: Order[]
  nurseries: Nursery[]
  onView?: (id: string) => void
  onProcess?: (id: string) => void
  onMarkReady?: (id: string) => void
  onMarkPickedUp?: (id: string) => void
  onCancel?: (id: string) => void
  onFilter?: (filters: { status?: OrderStatus; nurseryId?: string; dateFrom?: string; dateTo?: string }) => void
}

/** Props pour le détail d'une commande */
export interface OrderDetailProps {
  order: Order
  onProcess?: () => void
  onMarkReady?: () => void
  onMarkPickedUp?: () => void
  onCancel?: () => void
  onCreateTransfer?: () => void
  onBack?: () => void
}

/** Props pour la gestion des transferts */
export interface TransferManagementProps {
  transfers: Transfer[]
  nurseries: Nursery[]
  onView?: (id: string) => void
  onCreate?: () => void
  onOptimize?: (id: string) => void
  onStart?: (id: string) => void
  onComplete?: (id: string) => void
  onCancel?: (id: string) => void
}

/** Props pour le planning */
export interface ScheduleProps {
  slots: ScheduleSlot[]
  teamMembers: TeamMember[]
  nurseries: Nursery[]
  weekStartDate: string
  onSlotCreate?: (slot: Omit<ScheduleSlot, 'id'>) => void
  onSlotEdit?: (id: string) => void
  onSlotDelete?: (id: string) => void
  onWeekChange?: (weekStartDate: string) => void
}

/** Props pour la documentation */
export interface DocumentationProps {
  entries: DocumentationEntry[]
  onView?: (id: string) => void
  onCreate?: (type: DocumentationType) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onFilter?: (filters: { type?: DocumentationType; nurseryId?: string; tag?: string }) => void
}

/** Props pour les timesheets */
export interface TimesheetProps {
  entries: TimesheetEntry[]
  teamMembers: TeamMember[]
  nurseries: Nursery[]
  onView?: (id: string) => void
  onCreate?: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onFilter?: (filters: { memberId?: string; nurseryId?: string; category?: TimesheetCategory; dateFrom?: string; dateTo?: string }) => void
}

/** Props pour le catalogue multi-pépinières (vue Designer) */
export interface CatalogProps {
  nurseries: Nursery[]
  batches: StockBatch[]
  containers: Container[]
  onSearch?: (query: string) => void
  onFilter?: (filters: { nurseryId?: string; speciesId?: string; availableOnly?: boolean }) => void
  onSelectBatch?: (batchId: string) => void
}

